const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const Course = mongoose.model(schemaTitle.COURSE);
const User = mongoose.model(schemaTitle.USER);
const { HttpNotFound, HttpBadRequest, HttpUnauthorized } = require('../../utils/errors');
const examStatusCodes = require('../../constants/examStatusCodes');
const {
    filterAndSortTimelines,
    getListAssignmentAndExam,
    getTimelineExport,
    getSurveyBankExport,
    getQuizBankExport,
    getDeadlineOfSubject,
    getCommonInfo,
} = require('../../services/DataMapper');
const _ = require('lodash');
const { MailOptions, MailTemplate } = require('../../utils/mailOptions');
const { sendMail } = require('../../services/SendMail');
const DETAILS = require('../../constants/AccountDetail');
const PRIVILEGES = require('../../constants/PrivilegeCode');
const { getCurrentSemester } = require('../../common/getCurrentSemester');
const { ClientResponsesMessages } = require('../../constants/ResponseMessages');
const { CourseResponseMessages } = ClientResponsesMessages


exports.create = async (req, res) => {
    const data = req.body;
    const curSemester = getCurrentSemester();
    const course = new Course({
        name: data.name,
        idSemester: curSemester._id,
        config: data.config,
        idTeacher: req.teacher._id,
    });

    await course.save();

    res.json({
        success: true,
        course: getCommonInfo(course),
        message: CourseResponseMessages.CREATE_COURSE_SUCCESS(course.name)
    });
};

exports.findAll = async (req, res) => {
    const idPrivilege = req.user.idPrivilege;
    let allCourses = [];
    if (idPrivilege === PRIVILEGES.TEACHER) {
        allCourses = await Course.find({ idTeacher: req.user._id, isDeleted: false }, "name");
    } else {
        const courses = await Course.find({ 'studentIds': req.user._id, isDeleted: false })
        allCourses = await Promise.all(courses.map(async (value) => {
            const teacher = await User.findOne({ _id: value.idTeacher }, DETAILS.COMMON)
            return { _id: value._id, name: value.name, lecture: teacher };
        }));
    }

    res.json({
        success: true,
        allCourses: allCourses
    });
};

exports.find = async (req, res) => {
    const course = req.course;
    let timelines = req.course.timelines;
    timelines = await filterAndSortTimelines(timelines, req.user.idPrivilege === PRIVILEGES.TEACHER ? false : true);
    const result = {
        _id: course._id,
        name: course.name,
        teacher: await User.findById(course.idTeacher, DETAILS.COMMON),
        timelines: timelines || []
    };
    res.json({
        success: true,
        course: result
    });
};

exports.findAllPublicSubject = async (req, res) => {
    const course = await Course.find({ 'config.role': 'public', isDeleted: false })
    const allCourses = await Promise.all(course.map(async (value) => {
        var teacher = await User.findOne({ _id: value.idTeacher }, DETAILS.COMMON)
        return { _id: value._id, name: value.name, lecture: teacher };
    }));

    res.json({
        success: true,
        allCourses: allCourses
    });
}

//Config of subjects
exports.getConfig = async (req, res) => {
    const course = req.course;
    res.json({
        success: true,
        course: {
            _id: course._id,
            name: course.name,
            config: course.config
        }
    });
}

exports.updateConfig = async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) {
        throw new HttpNotFound(CourseResponseMessages.COURSE_NOT_FOUND);
    }
    const data = req.body;

    if (data.config) {
        course.config.acceptEnroll = data.config.acceptEnroll || false;
    }

    await course.save();

    res.json({
        success: true,
        message: CourseResponseMessages.UPDATE_CONFIG_SUCCESS,
        course: {
            _id: course._id,
            name: course.name,
            config: course.config
        }
    });
};

//Enroll Requests
exports.getEnrollRequests = async (req, res) => {
    const course = req.course;

    const requests = await Promise.all(
        course.enrollRequests.map(async (id) =>
            await User.findById(id, DETAILS.COMMON)
        ));

    res.json({
        success: true,
        requests
    });
}

exports.enrollSubject = async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) {
        throw new HttpNotFound(CourseResponseMessages.COURSE_NOT_FOUND);
    }
    const student = req.student;

    if (course.config.role === 'private') {
        throw new HttpUnauthorized(CourseResponseMessages.ENROLL_COURSE_PROHIBIT);
    }

    const isEnrolled = course.enrollRequests.find(value => value.equals(student._id));
    if (isEnrolled) {
        throw new HttpUnauthorized(CourseResponseMessages.ENROLL_COURSE_REQUESTED);
    }

    const isExists = course.studentIds.find(value => value.equals(student._id));
    if (isExists) {
        throw new HttpUnauthorized(CourseResponseMessages.EXISTED_IN_COURSE);
    }

    const isAcceptEnroll = course.config.acceptEnroll;
    if (isAcceptEnroll) {
        course.studentIds.push(student._id);
    } else {
        course.enrollRequests.push(student._id);
    }
    await course.save();

    //Send email to teacher
    const teacher = await User.findById(course.idTeacher, 'emailAddress');
    let mailOptions;
    if (isAcceptEnroll) {
        mailOptions = MailTemplate.MAIL_NOTIFY_STUDENT_ENROLL(student, teacher, course);
    } else {
        mailOptions = MailTemplate.MAIL_NOTIFY_STUDENT_REQUEST_ENROLL(student, teacher, course);
    }
    //sendMail(mailOptions);

    res.json({
        success: true,
        message: CourseResponseMessages.ENROLL_COURSE_REQUEST_STATUS(isAcceptEnroll),
        course: getCommonInfo(course),
        isAcceptEnroll
    });
}

exports.acceptEnrollRequest = async (req, res) => {
    const course = req.course;

    const isEnrolled = course.enrollRequests.find(value => value.equals(req.body.idStudent));
    if (!isEnrolled) {
        throw new HttpNotFound(CourseResponseMessages.REQUEST_NOT_FOUND);
    }

    const isExists = course.studentIds.find(value => value.equals(req.body.idStudent));
    if (isExists) {
        throw new HttpBadRequest(CourseResponseMessages.STUDENT_ALREADY_IN_COURSE);
    }

    const index = course.enrollRequests.indexOf(isEnrolled);
    course.enrollRequests.splice(index, 1)
    course.studentIds.push(req.body.idStudent);
    await course.save();

    //Send email to student
    const student = await User.findById(req.body.idStudent, DETAILS.COMMON)
    const mailOptions = MailTemplate.MAIL_NOTIFY_ENROLL_REQUEST_PROCESS(student, course, true);
    sendMail(mailOptions);

    res.json({
        success: true,
        message: CourseResponseMessages.ACCEPT_ENROLL_SUCCESS,
        student: student
    });
}

exports.denyEnrollRequest = async (req, res) => {
    const course = req.course;

    const isEnrolled = course.enrollRequests.find(value => value.equals(req.body.idStudent));
    if (!isEnrolled) {
        throw new HttpNotFound(CourseResponseMessages.REQUEST_NOT_FOUND);
    }
    const index = course.enrollRequests.indexOf(isEnrolled);
    course.enrollRequests.splice(index, 1)
    await course.save();

    //Send email to student
    const student = await User.findById(req.body.idStudent, 'emailAddress')

    const mailOptions = MailTemplate.MAIL_NOTIFY_ENROLL_REQUEST_PROCESS(student, course, false);

    sendMail(mailOptions);

    res.json({
        success: true,
        message: CourseResponseMessages.DENY_ENROLL_SUCCESS,
    });
}

//Exit subject
exports.getExitRequests = async (req, res) => {
    const course = req.course;

    const requests = await Promise.all(
        course.exitRequests.map(async (value) =>
            await User.findById(value, DETAILS.COMMON)
        ));
    res.json({
        success: true,
        requests
    });
}

exports.exitSubject = async (req, res) => {
    const course = req.course;
    let message;
    if (course.config.role === 'public') {
        const index = course.studentIds.indexOf(req.student._id);
        course.studentIds.splice(index, 1);
        message = CourseResponseMessages.EXIT_COURSE_SUCCESS
    } else {
        const isReq = course.exitRequests.find(value => value.equals(req.student._id));
        if (isReq) {
            throw new HttpUnauthorized(CourseResponseMessages.EXIT_COURSE_REQUESTED);
        }
        course.exitRequests.push(req.student._id);

        const teacher = await User.findById(course.idTeacher, DETAILS.COMMON);

        const student = req.student;

        const mailOptions = MailTemplate.MAIL_NOTIFY_EXIT_COURSE_REQUEST(student, teacher, course);

        //sendMail(mailOptions);

        message = CourseResponseMessages.EXIT_COURSE_SENT
    }
    await course.save();

    res.json({
        success: true,
        message,
    });
}

exports.acceptExitRequest = async (req, res) => {
    const course = req.course;

    const isRed = course.exitRequests.find(value => value.equals(req.body.idStudent));
    if (!isRed) {
        throw new HttpNotFound(CourseResponseMessages.REQUEST_NOT_FOUND);
    }
    const index = course.studentIds.indexOf(req.body.idStudent);
    course.exitRequests.splice(course.exitRequests.indexOf(isRed), 1)
    course.studentIds.splice(index, 1);

    await course.save();

    //Send email to student
    const student = await User.findById(req.body.idStudent, DETAILS.COMMON)
    const mailOptions = MailTemplate.MAIL_NOTIFY_EXIT_COURSE_PROCESS(student, course, true);
    sendMail(mailOptions);

    res.json({
        success: true,
        message: CourseResponseMessages.ACCEPT_EXIT_SUCCESS,
    });
}

exports.denyExitRequest = async (req, res) => {
    const course = req.course;

    const isReq = course.exitRequests.find(value => value.equals(req.body.idStudent));
    if (!isReq) {
        throw new HttpNotFound(CourseResponseMessages.REQUEST_NOT_FOUND);
    }
    const index = course.exitRequests.indexOf(isReq);
    course.exitRequests.splice(index, 1)
    await course.save();

    //Send email to student
    const student = await User.findById(req.body.idStudent, DETAILS.COMMON)

    const mailOptions = MailTemplate.MAIL_NOTIFY_EXIT_COURSE_PROCESS(student, course, false);

    sendMail(mailOptions);

    res.json({
        success: true,
        message: CourseResponseMessages.DENY_EXIT_SUCCESS,
    });
}

//List students in subject
exports.getListStudent = async (req, res) => {
    const course = req.course;

    const students = _.sortBy(await Promise.all(
        course.studentIds.map(async (idStudent) =>
            await User.findById(idStudent, DETAILS.COMMON)
        )), ['code']);
    res.json({
        success: true,
        students
    });
}

exports.addStudent = async (req, res) => {
    const course = req.course;

    const student = await User.findOne({
        code: req.body.idStudent,
        idPrivilege: PRIVILEGES.STUDENT || PRIVILEGES.REGISTER
    }, DETAILS.COMMON);
    if (!student) {
        throw new HttpNotFound(CourseResponseMessages.NOT_FOUND_STUDENT_WITH_CODE(req.body.idStudent));
    }

    const isExists = course.studentIds.find(value => value.equals(student._id));
    if (isExists) {
        throw new HttpBadRequest(CourseResponseMessages.STUDENT_ALREADY_IN_COURSE);
    }

    course.studentIds.push(student._id);
    await course.save()

    res.json({
        success: true,
        message: CourseResponseMessages.ADD_STUDENT_SUCCESS(req.body.idStudent),
        student: student
    });
};

exports.removeStudent = async (req, res) => {
    const subject = req.subject;

    const index = subject.studentIds.indexOf(req.body.idStudent);

    if (index === -1) {
        throw new HttpNotFound(CourseResponseMessages.NOT_FOUND_STUDENT_IN_COURSE);
    }
    subject.studentIds.splice(index, 1);
    await subject.save();

    res.json({
        success: true,
        message: CourseResponseMessages.REMOVE_STUDENT_SUCCESS,
    });
}

// Order timelines of course
exports.getOrderOfTimeLine = async (req, res) => {
    const data = req.course;
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

exports.adjustOrderOfTimeline = async (req, res) => {
    const adjust = req.body;
    const course = req.course;
    await adjust.forEach(element => {
        var timeline = course.timelines.find(x => x._id.equals(element._id));
        timeline.index = element.index;
    });
    await course.save();

    const timelines = await filterAndSortTimelines(course.timelines, false);
    res.json({
        success: true,
        message: CourseResponseMessages.ADJUST_INDEX_TIMELINES_SUCCESS,
        timelines: timelines
    })
}

// Score in course
exports.getSubjectTranscript = async (req, res) => {
    const course = req.course;
    const today = new Date();
    const fields = await getListAssignmentAndExam(course, today);
    if (req.user.idPrivilege === PRIVILEGES.STUDENT ||
        req.user.idPrivilege === PRIVILEGES.REGISTER) {

        let transcript = await Promise.all(fields.map(async (field) => {
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
        let transcript = await Promise.all(fields.map(async (field) => {
            let submissions = await Promise.all(
                course.studentIds.map(async (idStudent) => {
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

exports.getSubjectTranscriptTotal = async (req, res) => {
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
        async (idStudent) => {
            const student = await User.findById(idStudent, DETAILS.COMMON)
                .then(value => { return value });
            let data = {
                'c0': student.code,
                'c1': student.lastName,
                'c2': student.firstName
            };
            let count = 3;
            let grade = await Promise.all(assignmentOrExam.map(async (value) => {
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

exports.updateRatioTranscript = async (req, res) => {
    let subject = req.subject;
    let adjust = req.body;
    await adjust.forEach(async (value) => {
        let transcript = await subject.transcript.find(ratio => ratio._id.equals(value._id));
        if (transcript) {
            transcript.ratio = value.ratio;
        }
    });

    await subject.save();

    return this.getSubjectTranscriptTotal(req, res);
}

//Import, Export Subject
exports.importSubject = async (req, res) => {
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

    const timelines = await filterAndSortTimelines(subject.timelines);

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

exports.exportSubject = async (req, res) => {
    const subject = await Course.findById(req.params.id)
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

exports.exportSubjectWithCondition = async (req, res) => {
    const subject = await Course.findById(req.params.id);
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
exports.getDeadline = async (req, res) => {
    const listSubject = await Course.find({ 'studentIds': req.student._id, isDeleted: false });
    let deadline = [];
    listSubject.forEach(subject => {
        deadline = deadline.concat(getDeadlineOfSubject(subject, req.student));
    });

    res.json({
        success: true,
        deadline: _.sortBy(deadline, ['expireTime'])
    });
}

exports.getDeadlineBySubject = async (req, res) => {
    let deadline = getDeadlineOfSubject(req.subject, req.student);

    res.json({
        success: true,
        deadline: _.sortBy(deadline, ['expireTime'])
    });
}

//Check zoom
exports.getZoom = (req, res) => {
    const course = req.course;
    res.json({
        success: true,
        idRoom: course._id
    });
}