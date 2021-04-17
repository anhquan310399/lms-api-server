const mongoose = require("mongoose");
const Subject = mongoose.model("Subject");
const User = mongoose.model("User");
const { HttpNotFound, HttpBadRequest } = require('../utils/errors');
const examStatusCodes = require('../constants/examStatusCodes');
const {
    filterTimelines,
    getListAssignmentAndExam,
    getTimelineExport,
    getSurveyBankExport,
    getQuizBankExport,
    getDeadlineOfSubject
} = require('../services/DataMapper');
const _ = require('lodash');

exports.create = async(req, res) => {
    const data = new Subject({
        name: req.body.name,
        idLecture: req.body.idLecture,
        studentIds: req.body.studentIds,
        timelines: req.body.timelines,
        quizBank: req.body.quizBank,
        surveyBank: req.body.surveyBank
    });

    const subject = await data.save();
    const teacher = await User.findOne({ code: subject.idLecture },
        'code firstName lastName urlAvatar');
    res.json({
        success: true,
        subject: {
            _id: subject._id,
            name: subject.name,
            lecture: teacher,
            studentCount: subject.studentIds.length,
            isDeleted: subject.isDeleted
        },
        message: `Create new subject ${subject.name} successfully!`
    });
};

exports.findAll = async(req, res) => {
    const idPrivilege = req.user.idPrivilege;
    let allSubject = [];
    if (idPrivilege === 'teacher') {
        allSubject = await Subject.find({ idLecture: req.user.code, isDeleted: false }, "name");
    } else if (idPrivilege === 'student') {
        const subjects = await Subject.find({ 'studentIds': req.user.code, isDeleted: false })
        allSubject = await Promise.all(subjects.map(async(value) => {
            var teacher = await User.findOne({ code: value.idLecture }, 'code firstName lastName urlAvatar')
            return { _id: value._id, name: value.name, lecture: teacher };
        }));
    } else if (idPrivilege === 'admin') {
        const subjects = await Subject.find({});
        allSubject = await Promise.all(subjects.map(async(value) => {
            var teacher = await User.findOne({ code: value.idLecture }, 'code firstName lastName urlAvatar')
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

    if (req.user.idPrivilege === 'student') {
        timelines = await timelines.filter((value) => {
            return !value.isDeleted;
        });
        timelines = await filterTimelines(timelines, true);
    } else {
        timelines = await filterTimelines(timelines, false);
    }

    const teacher = await User.findOne({ code: subject.idLecture },
        'code firstName lastName urlAvatar');

    let result = {
        _id: subject._id,
        name: subject.name,
        lecture: teacher,
        timelines: timelines
    };
    res.json({
        success: true,
        subject: result
    });
};

exports.findByAdmin = async(req, res) => {
    const subject = await Subject.findById(req.params.idSubject);
    if (!subject) {
        throw new HttpNotFound("Not found subject");
    }
    var teacher = await User.findOne({ code: subject.idLecture },
        'code firstName lastName urlAvatar');
    res.json({
        success: true,
        subject: {
            _id: subject._id,
            name: subject.name,
            lecture: teacher,
            studentCount: subject.studentIds.length,
            isDeleted: subject.isDeleted
        }
    });
}

exports.update = async(req, res) => {
    const subject = await Subject.findById(req.params.idSubject);
    if (!subject) {
        throw new HttpNotFound("Not found subject");
    }

    subject.name = req.body.name || subject.name;
    subject.idLecture = req.body.idLecture || subject.idLecture;
    subject.studentIds = req.body.studentIds || subject.studentIds;
    subject.timelines = req.body.timelines || subject.timelines;
    subject.surveyBank = req.body.surveyBank || subject.surveyBank;
    subject.quizBank = req.body.quizBank || subject.quizBank;

    await subject.save();

    res.json({
        success: true,
        message: "Update Subject Successfully"
    });
};

exports.importSubject = async(req, res) => {
    let subject = req.subject;

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

    const timelines = await filterTimelines(subject.timelines, false);

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

exports.delete = async(req, res) => {
    const data = await Subject.findByIdAndDelete(req.params.idSubject)
    if (!data) {
        throw new HttpNotFound("Not found subject");
    }
    res.json({
        success: true,
        message: `Delete Subject ${data.name} Successfully`
    });

};

exports.hideOrUnhide = async(req, res) => {
    const subject = await Subject.findById(req.params.idSubject)
    if (!subject) {
        throw new HttpNotFound("Not found subject");
    }
    subject.isDeleted = !subject.isDeleted;
    await subject.save()
    let message;
    if (subject.isDeleted) {
        message = `Lock subject: ${subject.name} successfully!`;
    } else {
        message = `Unlock subject : ${subject.name} successfully!`;
    }
    res.json({
        success: true,
        message: message,
    });
};

exports.addListStudents = async(req, res) => {
    const subject = await Subject.findById(req.params.idSubject);
    if (!subject) {
        throw new HttpNotFound("Not found subject");
    }
    var list = subject.studentIds.concat(req.body).sort();
    list = list.filter((a, b) => list.indexOf(a) === b);
    subject.studentIds = list;
    await subject.save();
    res.json({
        success: true,
        message: "Add Student Successfully!"
    });

};

exports.addStudent = async(req, res) => {
    let subject = req.subject;

    let idStudent = subject.studentIds.find(value => { return value === req.body.idStudent });
    if (idStudent) {
        throw new HttpBadRequest('This student has already in subject');
    }

    const user = await User.findOne({ code: req.body.idStudent, idPrivilege: 'student' },
        'code firstName lastName urlAvatar');
    if (!user) {
        throw new HttpNotFound(`Not found student with id: ${req.body.idStudent}`);
    }
    subject.studentIds.push(req.body.idStudent);
    await subject.save()

    const info = await Promise.all(subject.studentIds.map(async function(value) {
        var student = await User.findOne({ code: value }, 'code emailAddress firstName lastName urlAvatar');
        return student;
    }));

    res.json({
        success: true,
        message: `Add Student with code ${req.body.idStudent} Successfully!`,
        students: info
    });
};

exports.removeStudent = async(req, res) => {
    // Validate request
    let subject = req.subject;

    let index = subject.studentIds.indexOf(req.body.idStudent);
    if (index === -1) {
        throw new HttpNotFound(`Not found this student with id: ${req.body.idStudent}`);
    }
    subject.studentIds.splice(index, 1);
    await subject.save();

    const info = await Promise.all(subject.studentIds.map(async function(value) {
        var student = await User.findOne({ code: value },
            'code emailAddress firstName lastName urlAvatar');
        return student;
    }));
    // res.send(data);
    res.json({
        success: true,
        message: `Remove Student with code ${req.body.idStudent} Successfully!`,
        students: info
    });
}

exports.adjustOrderOfTimeline = async(req, res) => {
    const adjust = req.body;
    const subject = req.subject;
    await adjust.forEach(element => {
        var timeline = subject.timelines.find(x => x._id == element._id);
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

exports.getListStudent = async(req, res) => {
    const subject = req.subject;

    var info = await Promise.all(subject.studentIds.map(async function(value) {
        var student = await User.findOne({ code: value },
            'code emailAddress firstName lastName urlAvatar');

        return student;
    }));
    res.json({
        success: true,
        students: info
    });
}


exports.getSubjectTranscript = async(req, res) => {
    let subject = req.subject;
    let today = new Date();
    let fields = await getListAssignmentAndExam(subject, today);

    if (req.user.idPrivilege === 'student') {
        let transcript = await Promise.all(fields.map(async(field) => {
            let submission = await field.submissions.find(value => value.idStudent == req.user._id);
            let grade = 0;
            let status;
            if (field.type === 'exam') {
                if (submission || (!submission && !field.isRemain)) {
                    grade = submission.grade || 0;
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
        return res.send(transcript);
    } else {
        let transcript = await Promise.all(fields.map(async(field) => {
            let submissions = await Promise.all(subject.studentIds.map(
                async(value) => {
                    let student = await User.findOne({ code: value }, 'code firstName lastName urlAvatar');

                    let submission = field.submissions.find(value => value.idStudent == student._id);
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

        return res.json(transcript);
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
        let transcript = subject.transcript.find(ratio => ratio.idField == value._id);
        ratios[key] = {
            _id: transcript._id,
            ratio: transcript.ratio
        };
        totalRatio += transcript.ratio;
    });

    let data = await Promise.all(subject.studentIds.map(
        async(value) => {
            let student = await User.findOne({ code: value }, 'code firstName lastName urlAvatar')
                .then(value => { return value });
            let data = {
                'c0': student.code,
                'c1': student.lastName,
                'c2': student.firstName
            };
            let count = 3;
            let grade = await Promise.all(assignmentOrExam.map(async(value) => {
                let submission = value.submissions.find(value => value.idStudent == student._id);
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
        let transcript = await subject.transcript.find(ratio => ratio._id == value._id);
        if (transcript) {
            transcript.ratio = value.ratio;
        }
    });

    await subject.save();

    return this.getSubjectTranscriptTotal(req, res);
}

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

exports.getDeadline = async(req, res) => {
    const listSubject = await Subject.find({ 'studentIds': req.student.code, isDeleted: false });
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