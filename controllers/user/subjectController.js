const mongoose = require("mongoose");
const Subject = mongoose.model("Subject");
const User = mongoose.model("User");
const { HttpNotFound, HttpBadRequest, HttpUnauthorized } = require('../../utils/errors');
const examStatusCodes = require('../../constants/ExamStatusCodes');
const {
    filterTimelines,
    getListAssignmentAndExam,
    getTimelineExport,
    getSurveyBankExport,
    getQuizBankExport,
    getDeadlineOfSubject,
    getCommonData,
} = require('../../services/DataMapper');
const _ = require('lodash');
const { MailOptions } = require('../../utils/mailOptions');
const { sendMail } = require('../../services/SendMail');
const DETAILS = require('../../constants/AccountDetail');
const PRIVILEGES = require('../../constants/PrivilegeCode');

exports.create = async(req, res) => {
    const data = req.body;
    const subject = new Subject({
        name: data.name,
        idCourse: process.env.CURRENT_COURSE,
        config: {
            role: data.config.role,
            acceptEnroll: data.config.acceptEnroll
        },
        idLecture: req.lecture._id,
    });

    await subject.save();

    res.json({
        success: true,
        subject: await getCommonData(subject),
        message: `Create new subject ${subject.name} successfully!`
    });
};

exports.findAll = async(req, res) => {
    const idPrivilege = req.user.idPrivilege;
    let allSubject = [];
    if (idPrivilege === PRIVILEGES.TEACHER) {
        allSubject = await Subject.find({ idLecture: req.user._id, isDeleted: false }, "name");
    } else {
        const subjects = await Subject.find({ 'studentIds': req.user._id, isDeleted: false })
        allSubject = await Promise.all(subjects.map(async(value) => {
            const teacher = await User.findOne({ _id: value.idLecture }, DETAILS.COMMON)
            return { _id: value._id, name: value.name, lecture: teacher };
        }));
    }

    res.json({
        success: true,
        allSubject: allSubject
    });
};

exports.find = async(req, res) => {
    const subject = req.subject;
    let timelines = req.subject.timelines;
    timelines = await filterTimelines(timelines, req.user.idPrivilege === PRIVILEGES.STUDENT ? true : false);
    const result = {
        _id: subject._id,
        name: subject.name,
        lecture: await User.findById(subject.idLecture, DETAILS.COMMON),
        timelines: timelines || []
    };
    res.json({
        success: true,
        subject: result
    });
};

exports.findAllPublicSubject = async(req, res) => {
    const subjects = await Subject.find({ 'config.role': 'public', isDeleted: false })
    const allSubject = await Promise.all(subjects.map(async(value) => {
        var teacher = await User.findOne({ _id: value.idLecture }, DETAILS.COMMON)
        return { _id: value._id, name: value.name, lecture: teacher };
    }));

    res.json({
        success: true,
        allSubject: allSubject
    });
}

//Config of subjects
exports.getConfig = async(req, res) => {
    const subject = req.subject;
    res.json({
        success: true,
        subject: {
            _id: subject._id,
            name: subject.name,
            config: subject.config
        }
    });
}

exports.updateConfig = async(req, res) => {
    const subject = await Subject.findById(req.params.idSubject);
    if (!subject) {
        throw new HttpNotFound("Not found subject");
    }
    const data = req.body;

    if (data.config) {
        subject.config.acceptEnroll = data.config.acceptEnroll || false;
    }

    await subject.save();

    res.json({
        success: true,
        message: "Update config of Subject Successfully",
        subject: {
            _id: subject._id,
            name: subject.name,
            config: subject.config
        }
    });
};

//Enroll Requests
exports.getEnrollRequests = async(req, res) => {
    const subject = req.subject;

    const requests = await Promise.all(
        subject.enrollRequests.map(async(id) =>
            await User.findById(id, DETAILS.COMMON)
        ));

    res.json({
        success: true,
        requests
    });
}

exports.enrollSubject = async(req, res) => {
    const subject = await Subject.findById(req.params.idSubject);
    if (!subject) {
        throw new HttpNotFound("Not found subject");
    }
    const student = req.student;

    if (subject.config.role === 'private') {
        throw new HttpUnauthorized('This subject can not enroll!');
    }

    const isEnrolled = subject.enrollRequests.find(value => value.equals(student._id));
    if (isEnrolled) {
        throw new HttpUnauthorized('You have already requested to enroll this subject!');
    }

    const isExists = subject.studentIds.find(value => value.equals(student._id));
    if (isExists) {
        throw new HttpUnauthorized('You have already in subject');
    }

    const isAcceptEnroll = subject.config.acceptEnroll;
    if (isAcceptEnroll) {
        subject.studentIds.push(student._id);
    } else {
        subject.enrollRequests.push(student._id);
    }
    await subject.save();

    //Send email to teacher
    const teacher = await User.findById(subject.idLecture, 'emailAddress');
    let mailOptions;
    if (isAcceptEnroll) {
        mailOptions = new MailOptions({
            to: teacher.emailAddress,
            subject: `[${subject.name}] - New Student Enroll`,
            text: `Student: ${student.firstName
                +" "+ student.lastName}, 
                MSSV: ${student.code} has just enrolled your subject [${subject.name}]`
        });
    } else {
        mailOptions = new MailOptions({
            to: teacher.emailAddress,
            subject: `[${subject.name}] - New Enroll Request`,
            text: `Student: ${student.firstName
                +" "+ student.lastName}, 
                MSSV: ${student.code} has just requested enroll your subject [${subject.name}]`
        });
    }
    //sendMail(mailOptions);

    res.json({
        success: true,
        message: isAcceptEnroll ?
            "You have been accepted to enroll this subject!" : "Your request has been send to the lecture. Wait!!!",
        subject: getCommonData(subject),
        isAcceptEnroll
    });
}

exports.acceptEnrollRequest = async(req, res) => {
    const subject = req.subject;

    const isEnrolled = subject.enrollRequests.find(value => value.equals(req.body.idStudent));
    if (!isEnrolled) {
        throw new HttpNotFound('Can not found this request!');
    }

    const isExists = subject.studentIds.find(value => value.equals(req.body.idStudent));
    if (isExists) {
        throw new HttpBadRequest('This student has already in subject');
    }

    const index = subject.enrollRequests.indexOf(isEnrolled);
    subject.enrollRequests.splice(index, 1)
    subject.studentIds.push(req.body.idStudent);
    await subject.save();

    //Send email to student
    const student = await User.findById(req.body.idStudent, DETAILS.COMMON)
    const mailOptions = new MailOptions({
        to: student.emailAddress,
        subject: `[${subject.name}] - Accept Enroll Request`,
        text: `Your request to enroll subject [${subject.name}] has just accepted!`
    });
    sendMail(mailOptions);

    res.json({
        success: true,
        message: "Accept enroll request successfully!",
        student: student
    });
}

exports.denyEnrollRequest = async(req, res) => {
    const subject = req.subject;

    const isEnrolled = subject.enrollRequests.find(value => value.equals(req.body.idStudent));
    if (!isEnrolled) {
        throw new HttpNotFound('Can not found this request!');
    }
    const index = subject.enrollRequests.indexOf(isEnrolled);
    subject.enrollRequests.splice(index, 1)
    await subject.save();

    //Send email to student
    const student = await User.findById(req.body.idStudent, 'emailAddress')
    const mailOptions = new MailOptions({
        to: student.emailAddress,
        subject: `[${subject.name}] - Deny Enroll Request`,
        text: `Your request to enroll subject [${subject.name}] has just denied!`
    });
    sendMail(mailOptions);

    res.json({
        success: true,
        message: "Deny enroll request successfully!",
    });
}

//Exit subject
exports.getExitRequests = async(req, res) => {
    const subject = req.subject;

    const requests = await Promise.all(
        subject.exitRequests.map(async(value) =>
            await User.findById(value, DETAILS.COMMON)
        ));
    res.json({
        success: true,
        requests
    });
}

exports.exitSubject = async(req, res) => {
    const subject = req.subject;
    let message = ""
    if (subject.config.role === 'public') {
        const index = subject.studentIds.indexOf(req.student._id);
        subject.studentIds.splice(index, 1);
        message = `You has just exit subject [${subject.name}]`
    } else {
        const isReq = subject.exitRequests.find(value => value.equals(req.student._id));
        if (isReq) {
            throw new HttpUnauthorized("You have already request to exit this subject!");
        }
        subject.exitRequests.push(req.student._id);
        const teacher = await User.findById(subject.idLecture, 'emailAddress');
        const student = await User.findById(req.student._id, DETAILS.COMMON);
        const mailOptions = new MailOptions({
            to: teacher.emailAddress,
            subject: `[${subject.name}] - Request Exit Subject`,
            text: `Student: ${student.firstName
                +" "+ student.lastName}, 
                MSSV: ${student.code} has just request to exit your subject [${subject.name}]`
        });
        //sendMail(mailOptions);
        message = `Your request has already send to the Lecture!`
    }
    await subject.save();

    res.json({
        success: true,
        message,
    });
}

exports.acceptExitRequest = async(req, res) => {
    const subject = req.subject;

    const isRed = subject.exitRequests.find(value => value.equals(req.body.idStudent));
    if (!isRed) {
        throw new HttpNotFound('Can not found this request!');
    }
    const index = subject.studentIds.indexOf(req.body.idStudent);
    subject.exitRequests.splice(subject.exitRequests.indexOf(isRed), 1)
    subject.studentIds.splice(index, 1);

    await subject.save();

    //Send email to student
    const student = await User.findById(req.body.idStudent, 'emailAddress')
    const mailOptions = new MailOptions({
        to: student.emailAddress,
        subject: `[${subject.name}] - Accept Exit Request`,
        text: `Your request to exit subject [${subject.name}] has just accepted!`
    });
    sendMail(mailOptions);

    res.json({
        success: true,
        message: "Accept exit request successfully!",
    });
}

exports.denyExitRequest = async(req, res) => {
    const subject = req.subject;

    const isReq = subject.exitRequests.find(value => value.equals(req.body.idStudent));
    if (!isReq) {
        throw new HttpNotFound('Can not found this request!');
    }
    const index = subject.exitRequests.indexOf(isReq);
    subject.exitRequests.splice(index, 1)
    await subject.save();

    //Send email to student
    const student = await User.findById(req.body.idStudent, 'emailAddress')
    const mailOptions = new MailOptions({
        to: student.emailAddress,
        subject: `[${subject.name}] - Deny Exit Request`,
        text: `Your request to exit subject [${subject.name}] has just denied!`
    });
    sendMail(mailOptions);

    res.json({
        success: true,
        message: "Deny exit request successfully!",
    });
}

//List students in subject
exports.getListStudent = async(req, res) => {
    const subject = req.subject;

    const students = _.sortBy(await Promise.all(
        subject.studentIds.map(async(idStudent) =>
            await User.findById(idStudent, DETAILS.COMMON)
        )), ['code']);
    res.json({
        success: true,
        students
    });
}

exports.addStudent = async(req, res) => {
    const subject = req.subject;

    const student = await User.findOne({
        code: req.body.idStudent,
        idPrivilege: PRIVILEGES.STUDENT || PRIVILEGES.REGISTER
    }, DETAILS.COMMON);
    if (!student) {
        throw new HttpNotFound(`Not found student with id: ${req.body.idStudent}`);
    }

    const isExists = subject.studentIds.find(value => value.equals(student._id));
    if (isExists) {
        throw new HttpBadRequest('This student has already in subject');
    }

    subject.studentIds.push(student._id);
    await subject.save()

    res.json({
        success: true,
        message: `Add Student with code ${req.body.idStudent} Successfully!`,
        student: student
    });
};

exports.removeStudent = async(req, res) => {
    const subject = req.subject;

    const index = subject.studentIds.indexOf(req.body.idStudent);

    if (index === -1) {
        throw new HttpNotFound(`Not found this student in subject`);
    }
    subject.studentIds.splice(index, 1);
    await subject.save();

    res.json({
        success: true,
        message: `Remove Student Successfully!`,
    });
}

exports.addListStudents = async(req, res) => {
    const subject = await Subject.findById(req.params.idSubject);
    if (!subject) {
        throw new HttpNotFound("Not found subject");
    }
    var list = subject.studentIds.concat(req.body.studentIds).sort();
    list = list.filter((a, b) => list.indexOf(a) === b);
    subject.studentIds = list;
    await subject.save();
    res.json({
        success: true,
        message: "Add Student Successfully!"
    });

};

// Order timelines of subject
exports.getOrderOfTimeLine = async(req, res) => {
    const data = req.subject;
    let result = {
        _id: data._id,
        name: data.name,
        timelines: _.sortBy(data.timelines.map((value) => {
            return { _id: value._id, name: value.name, description: value.description, index: value.index, isDeleted: value.isDeleted };
        }), ['index']),
    };
    res.json({
        success: true,
        orderTimeline: result
    });
}

exports.adjustOrderOfTimeline = async(req, res) => {
    const adjust = req.body;
    const subject = req.subject;
    await adjust.forEach(element => {
        var timeline = subject.timelines.find(x => x._id.equals(element._id));
        timeline.index = element.index;
    });
    await subject.save();

    const timelines = await filterTimelines(subject.timelines, false);
    res.json({
        success: true,
        message: 'Adjust index of timeline successfully!',
        timelines: timelines
    })
}

// Score in subject
exports.getSubjectTranscript = async(req, res) => {
    const subject = req.subject;
    const today = new Date();
    const fields = await getListAssignmentAndExam(subject, today);
    if (req.user.idPrivilege === PRIVILEGES.STUDENT ||
        req.user.idPrivilege === PRIVILEGES.REGISTER) {

        let transcript = await Promise.all(fields.map(async(field) => {
            let submission = await field.submissions.find(value => value.idStudent.equals(req.user._id));
            let grade = 0;
            let status;
            if (field.type === 'exam') {
                if (submission || (!submission && !field.isRemain)) {
                    grade = submission ? submission.grade : 0;
                    status = examStatusCodes.COMPLETED;
                } else {
                    grade = null;
                    status = examStatusCodes.NOT_SUBMIT;
                }
            } else {
                if (submission) {
                    if (submission.isGrade) {
                        grade = submission.grade;
                        status = examStatusCodes.COMPLETED;
                    } else {
                        grade = null;
                        status = examStatusCodes.NOT_GRADE;
                    }
                } else if (field.isRemain) {
                    grade = null;
                    status = examStatusCodes.NOT_SUBMIT;
                } else {
                    grade = 0;
                    status = examStatusCodes.COMPLETED
                }
            }
            return {
                name: field.name,
                grade: grade,
                status: status
            }
        }))
        return res.send({
            success: true,
            transcript
        });
    } else {
        let transcript = await Promise.all(fields.map(async(field) => {
            let submissions = await Promise.all(
                subject.studentIds.map(async(idStudent) => {
                    const student = await User.findById(idStudent, DETAILS.COMMON);

                    let submission = field.submissions.find(value => value.idStudent.equals(student._id));
                    let isRemain = field.isRemain;

                    if (submission) {
                        if (field.type === 'exam') {
                            return {
                                student: student,
                                grade: submission.grade,
                                status: examStatusCodes.COMPLETED
                            }
                        } else if (field.type === 'assignment') {
                            if (submission.isGrade) {
                                return {
                                    student: student,
                                    grade: submission.grade,
                                    status: examStatusCodes.COMPLETED
                                }
                            } else {
                                return {
                                    student: student,
                                    grade: null,
                                    status: examStatusCodes.NOT_GRADE
                                }
                            }
                        }
                    } else if (isRemain) {
                        return {
                            student: student,
                            grade: null,
                            status: examStatusCodes.NOT_SUBMIT
                        }
                    } else {
                        return {
                            student: student,
                            grade: 0,
                            status: examStatusCodes.COMPLETED
                        }
                    }
                }))
            return {
                _id: field._id,
                name: field.name,
                submissions: submissions
            }
        }));

        return res.json({
            success: true,
            transcript
        });
    }
}

exports.getSubjectTranscriptTotal = async(req, res) => {
    let subject = req.subject;
    let today = new Date();
    let assignmentOrExam = await getListAssignmentAndExam(subject, today);

    let fields = { 'c0': 'MSSV', 'c1': 'Họ', 'c2': 'Tên' }
    let ratios = { 'c0': null, 'c1': null, 'c2': null }
    let count = 3;
    let totalRatio = 0;
    assignmentOrExam.forEach(value => {
        let key = 'c' + count++;
        fields[key] = value.name;
        let transcript = subject.transcript.find(ratio => ratio.idField.equals(value._id));
        ratios[key] = {
            _id: transcript._id,
            ratio: transcript.ratio
        };
        totalRatio += transcript.ratio;
    });

    let data = await Promise.all(subject.studentIds.map(
        async(idStudent) => {
            const student = await User.findById(idStudent, DETAILS.COMMON)
                .then(value => { return value });
            let data = {
                'c0': student.code,
                'c1': student.lastName,
                'c2': student.firstName
            };
            let count = 3;
            let grade = await Promise.all(assignmentOrExam.map(async(value) => {
                let submission = value.submissions.find(value => value.idStudent.equals(student._id));
                if (submission) {
                    return submission.grade;
                } else if (value.isRemain) {
                    return null;
                } else {
                    return 0;
                }

            }));
            let total = 0;
            grade.forEach(value => {
                let key = 'c' + count++;
                data[key] = value;
                total += (data[key] * ratios[key].ratio);
            });
            let key = 'c' + count;
            data[key] = (total / totalRatio).toFixed(2);
            ratios[key] = null;
            fields[key] = 'Trung bình';
            return data;
        }
    ));

    return res.send({
        fields: fields,
        ratio: ratios,
        data: data
    });

}

exports.updateRatioTranscript = async(req, res) => {
    let subject = req.subject;
    let adjust = req.body;
    await adjust.forEach(async(value) => {
        let transcript = await subject.transcript.find(ratio => ratio._id.equals(value._id));
        if (transcript) {
            transcript.ratio = value.ratio;
        }
    });

    await subject.save();

    return this.getSubjectTranscriptTotal(req, res);
}

//Import, Export Subject
exports.importSubject = async(req, res) => {
    const subject = req.subject;

    if (req.body.timelines) {
        if (subject.timelines.length === 0) {
            subject.timelines = req.body.timelines;
        } else {
            throw new HttpBadRequest('Đã có dữ liệu các tuần không thể import!');
        }
    }
    if (req.body.studentIds) {
        subject.studentIds = subject.studentIds.concat(req.body.studentIds);
        subject.studentIds = subject.studentIds.filter((a, b) => subject.studentIds.indexOf(a) === b)
    }
    if (req.body.surveyBank) {
        subject.surveyBank = subject.surveyBank.concat(req.body.surveyBank);
    }
    if (req.body.quizBank) {
        subject.quizBank = subject.quizBank.concat(req.body.quizBank);
    }

    await subject.save();

    const timelines = await filterTimelines(subject.timelines);

    const surveyBank = await Promise.all(subject.surveyBank.map(value => {
        return {
            _id: value._id,
            name: value.name,
            questions: value.questions.length
        }
    }));
    const quizBank = await Promise.all(subject.quizBank.map(value => {
        return {
            _id: value._id,
            name: value.name,
            questions: value.questions.length
        }
    }));
    res.json({
        success: true,
        message: `Import data to subject ${subject.name} successfully!`,
        timelines: timelines,
        surveyBank: surveyBank,
        quizBank: quizBank
    });
};

exports.exportSubject = async(req, res) => {
    const subject = await Subject.findById(req.params.idSubject)
    if (!subject) {
        throw new HttpNotFound("Not found subject");
    }
    const timelines = await getTimelineExport(subject.timelines);

    const quizBank = await getQuizBankExport(subject.quizBank);

    const surveyBank = await getSurveyBankExport(subject.surveyBank);

    subject = {
        timelines: timelines,
        quizBank: quizBank,
        surveyBank: surveyBank
    }

    res.attachment(`${subject.name}.json`)
    res.type('json')
    res.send(subject)
}

exports.exportSubjectWithCondition = async(req, res) => {
    const subject = await Subject.findById(req.params.idSubject);
    if (!subject) {
        throw new HttpNotFound("Not found subject");
    }
    let data = {};

    if (req.body.isTimelines) {
        let timelines = await getTimelineExport(subject.timelines)
        let surveyBank = await getSurveyBankExport(subject.surveyBank)
        let quizBank = await getQuizBankExport(subject.quizBank)
        data = {
            timelines: timelines,
            surveyBank: surveyBank,
            quizBank: quizBank
        }
    } else {
        if (req.body.isQuizBank) {
            let quizBank = await getQuizBankExport(subject.quizBank);
            quizBank = quizBank.map(value => { return { name: value.name, questions: value.questions } });
            data['quizBank'] = quizBank

        }
        if (req.body.isSurveyBank) {
            let surveyBank = await getSurveyBankExport(subject.surveyBank);
            surveyBank = surveyBank.map(value => { return { name: value.name, questions: value.questions } });
            data['surveyBank'] = surveyBank;
        }
    }

    res.attachment(`${subject.name}.json`);
    res.type('json');
    res.send(data);
}

//Get Deadline
exports.getDeadline = async(req, res) => {
    const listSubject = await Subject.find({ 'studentIds': req.student._id, isDeleted: false });
    let deadline = [];
    listSubject.forEach(subject => {
        deadline = deadline.concat(getDeadlineOfSubject(subject, req.student));
    });

    res.json({
        success: true,
        deadline: _.sortBy(deadline, ['expireTime'])
    });
}

exports.getDeadlineBySubject = async(req, res) => {
    let deadline = getDeadlineOfSubject(req.subject, req.student);

    res.json({
        success: true,
        deadline: _.sortBy(deadline, ['expireTime'])
    });
}

//Check zoom
exports.getZoom = (req, res) => {
    const subject = req.subject;
    res.json({
        success: true,
        idRoom: subject._id
    });
}