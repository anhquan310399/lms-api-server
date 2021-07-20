const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const Course = mongoose.model(schemaTitle.COURSE);
const User = mongoose.model(schemaTitle.USER);
const Subject = mongoose.model(schemaTitle.SUBJECT);
const Curriculum = mongoose.model(schemaTitle.CURRICULUM);
const { HttpNotFound, HttpBadRequest, HttpUnauthorized } = require('../../utils/errors');
const examStatusCodes = require('../../constants/examStatusCodes');
const {
    filterAndSortTimelines,
    getListAssignmentAndExam,
    getTimelineExport,
    getQuizBankExport,
    getDeadlineOfCourse,
    getCommonInfo,
    getUserById,
} = require('../../services/DataHelpers');
const _ = require('lodash');
const { MailTemplate } = require('../../utils/mailOptions');
const { sendMail } = require('../../services/SendMail');
const DETAILS = require('../../constants/AccountDetail');
const PRIVILEGES = require('../../constants/PrivilegeCode');
const { ClientResponsesMessages } = require('../../constants/ResponseMessages');
const { CourseResponseMessages } = ClientResponsesMessages

const { getPublicCodeOfNewCourse } = require("../../common/getCodeOfNewCourse");
const { getCurrentSemester } = require("../../common/getCurrentSemester");

exports.create = async (req, res) => {
    const subject = await Subject.findById(req.body.idSubject);

    if (!subject) {
        throw new HttpNotFound(CourseResponseMessages.NOT_FOUND_SUBJECT(req.body.idSubject));
    }

    const { code, name } = await getPublicCodeOfNewCourse(subject);

    const data = req.body;
    const course = new Course({
        name: data.name || name,
        idSubject: data.idSubject,
        code: code,
        config: {
            role: 'public',
            acceptEnroll: true
        },
        idTeacher: req.teacher._id,
    });

    await course.save();

    res.json({
        success: true,
        course: getCommonInfo(course),
        message: CourseResponseMessages.CREATE_COURSE_SUCCESS(course.name)
    });
};

exports.getAllEnrolledCourses = async (req, res) => {

    const semester = await getCurrentSemester();
    const privateCourses = await Course.find({ $or: [{ idTeacher: req.user._id }, { 'studentIds': req.user._id }], isDeleted: false, 'config.role': 'private', idSemester: semester._id }, "code name");
    const publicCourses = await Course.find({ $or: [{ idTeacher: req.user._id }, { 'studentIds': req.user._id }], isDeleted: false, 'config.role': 'public' }, "code name");
    const allCourses = {
        private: privateCourses,
        public: publicCourses
    }

    res.json({
        success: true,
        allCourses: allCourses
    });
};

const submitAssignment = async (course) => {
    const timeline = course.timelines[0];

    const assignment = timeline.assignments[0];

    const students = await User.find({
        _id: { $in: course.studentIds }
    }, "code");

    const submissions = await Promise.all(students.map(async (student) => {
        return {
            idStudent: student._id,
            submitTime: new Date(),
            file: {
                name: student.code,
                path: "https://res.cloudinary.com/dkepvw2rz/raw/upload/v1610770692/clqgybuex0epgcgtu5lx.rar",
                type: "rar"
            }
        }
    }));

    assignment.submissions = submissions;

    await course.save();

}

const gradeAssignment = async (course, teacher) => {
    const timeline = course.timelines[0];

    const assignment = timeline.assignments[0];
    const submissions = await Promise.all(assignment.submissions.map(async (submission) => {

        let grade = Math.round(Math.random() * 10) + 5;

        grade = grade > 10 ? grade - 6 : grade;
        submission.feedBack = {
            grade: grade,
            gradeOn: new Date(),
            gradeBy: teacher._id
        }
        return submission;
    }));

    assignment.submissions = submissions;

    await course.save();
}

exports.getDetail = async (req, res) => {
    const course = req.course;
    // await submitAssignment(course)
    // await gradeAssignment(course, req.user);

    let timelines = req.course.timelines;
    timelines = await filterAndSortTimelines(timelines, req.user.idPrivilege === PRIVILEGES.TEACHER ? false : true);
    const result = {
        _id: course._id,
        name: course.name,
        teacher: await getUserById(course.idTeacher, DETAILS.COMMON),
        timelines: timelines || []
    };
    res.json({
        success: true,
        course: result
    });
};

exports.findPublicSubject = async (req, res) => {
    const { idCurriculum, name } = req.body;

    const page = req.body.page || 1;
    const size = req.body.pageSize || 20;

    const curriculum = await Curriculum.findById(idCurriculum, "subjects");
    if (!curriculum) {
        throw new HttpNotFound(CourseResponseMessages.CURRICULUM_NOT_FOUND);
    }

    const searches = await Course.find({
        name: { $regex: new RegExp(name.toLowerCase(), "i") },
        idSubject: { $in: curriculum.subjects },
        'config.role': 'public',
        isDeleted: false
    }, "code name idTeacher").skip((page - 1) * size).limit(size);

    const total = await Course.countDocuments({
        name: { $regex: new RegExp(name.toLowerCase(), "i") },
        idSubject: { $in: curriculum.subjects },
        'config.role': 'public',
        isDeleted: false
    });

    const courses = await Promise.all(searches.map(async (value) => {
        const teacher = await getUserById({ _id: value.idTeacher }, DETAILS.COMMON)
        return { _id: value._id, name: value.name, teacher: teacher };
    }));

    res.json({
        success: true,
        courses: courses,
        total
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
            await getUserById(id, DETAILS.COMMON)
        ));

    res.json({
        success: true,
        requests
    });
}

exports.enrollSubject = async (req, res) => {
    const course = await Course.findById(req.params.idCourse);
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
    const teacher = await getUserById(course.idTeacher, 'emailAddress');

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
    const student = await getUserById(req.body.idStudent, DETAILS.COMMON)
    const mailOptions = MailTemplate.MAIL_NOTIFY_ENROLL_REQUEST_PROCESS(student, course, true);
    await sendMail(mailOptions);

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
    const student = await getUserById(req.body.idStudent, DETAILS.COMMON)

    const mailOptions = MailTemplate.MAIL_NOTIFY_ENROLL_REQUEST_PROCESS(student, course, false);

    await sendMail(mailOptions);

    res.json({
        success: true,
        message: CourseResponseMessages.DENY_ENROLL_SUCCESS,
    });
}

//Exit course
exports.getExitRequests = async (req, res) => {
    const course = req.course;

    const requests = await Promise.all(
        course.exitRequests.map(async (id) =>
            await getUserById(id, DETAILS.COMMON)
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

        const teacher = await getUserById(course.idTeacher, DETAILS.COMMON);

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
    const student = await getUserById(req.body.idStudent, DETAILS.COMMON)
    const mailOptions = MailTemplate.MAIL_NOTIFY_EXIT_COURSE_PROCESS(student, course, true);
    await sendMail(mailOptions);

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
    const student = await getUserById(req.body.idStudent, DETAILS.COMMON)

    const mailOptions = MailTemplate.MAIL_NOTIFY_EXIT_COURSE_PROCESS(student, course, false);

    await sendMail(mailOptions);

    res.json({
        success: true,
        message: CourseResponseMessages.DENY_EXIT_SUCCESS,
    });
}

//List students in course
exports.getListStudent = async (req, res) => {
    const course = req.course;

    const students = _.sortBy(await Promise.all(
        course.studentIds.map(async (idStudent) =>
            await getUserById(idStudent, DETAILS.COMMON)
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
    const course = req.course;

    const index = course.studentIds.indexOf(req.body.idStudent);

    if (index === -1) {
        throw new HttpNotFound(CourseResponseMessages.NOT_FOUND_STUDENT_IN_COURSE);
    }
    course.studentIds.splice(index, 1);
    await course.save();

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
        const timeline = course.timelines.find(x => x._id.equals(element._id));
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
                    const student = await getUserById(idStudent, DETAILS.COMMON);

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
    let course = req.course;
    let today = new Date();
    let assignmentOrExam = await getListAssignmentAndExam(course, today);

    let fields = { 'c0': 'MSSV', 'c1': 'Họ', 'c2': 'Tên' }
    let ratios = { 'c0': null, 'c1': null, 'c2': null }
    let count = 3;
    let totalRatio = 0;
    assignmentOrExam.forEach(value => {
        let key = 'c' + count++;
        fields[key] = value.name;
        let transcript = course.transcript.find(ratio => ratio.idField.equals(value._id));
        ratios[key] = {
            _id: transcript._id,
            ratio: transcript.ratio
        };
        totalRatio += transcript.ratio;
    });

    let data = await Promise.all(course.studentIds.map(
        async (idStudent) => {
            const student = await getUserById(idStudent, DETAILS.COMMON)
                .then(value => { return value });
            let data = {
                'c0': student.code,
                'c1': student.firstName,
                'c2': student.lastName
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
    let course = req.course;
    let adjust = req.body;
    await adjust.forEach(async (value) => {
        let transcript = await course.transcript.find(ratio => ratio._id.equals(value._id));
        if (transcript) {
            transcript.ratio = value.ratio;
        }
    });

    await course.save();

    return this.getSubjectTranscriptTotal(req, res);
}

//Import, Export course
exports.importQuizBank = async (req, res) => {
    const course = req.course;

    if (req.body.quizBank) {
        course.quizBank = course.quizBank.concat(req.body.quizBank);
    }

    await course.save();

    const quizBank = await Promise.all(course.quizBank.map(value => {
        return {
            _id: value._id,
            name: value.name,
            questions: value.questions.length
        }
    }));
    res.json({
        success: true,
        message: CourseResponseMessages.IMPORT_DATA_SUCCESS,
        quizBank: quizBank
    });
};

exports.exportQuizBank = async (req, res) => {
    const course = await Course.findById(req.params.id)
    if (!course) {
        throw new HttpNotFound(CourseResponseMessages.COURSE_NOT_FOUND);
    }

    const quizBank = await getQuizBankExport(course.quizBank);

    course = {
        quizBank: quizBank,
    }

    res.attachment(`${course.name}.json`)
    res.type('json')
    res.send(course)
}

exports.cloneExistedCourse = async (req, res) => {
    const course = req.course;

    const clone = await Course.findById(req.body.cloneId);
    if (!clone) {
        throw new HttpNotFound(CourseResponseMessages.COURSE_NOT_FOUND);
    }

    if (course.timelines.length > 0) {
        throw new HttpUnauthorized(CourseResponseMessages.COURSE_HAS_TIMELINES);
    }

    const quizBank = await getQuizBankExport(clone.quizBank);

    const timelines = await getTimelineExport(clone.timelines);

    course.quizBank = course.quizBank.concat(quizBank);

    course.timelines = course.timelines.concat(timelines);

    await course.save();

    res.json({
        success: true,
        message: CourseResponseMessages.IMPORT_DATA_SUCCESS,
        timelines: await filterAndSortTimelines(course.timelines),
        quizBank: await Promise.all(course.quizBank.map(value => {
            return {
                _id: value._id,
                name: value.name,
                questions: value.questions.length
            }
        }))
    });
}

exports.getAllCloneCourse = async (req, res) => {
    const course = req.course;

    const courses = await Course.find({
        idSubject: course.idSubject,
        _id: {
            $ne: course._id
        },
        idTeacher: req.teacher._id
    }, 'name code');
    res.json({
        success: true,
        courses,
    });
}

//Get Deadline
exports.getDeadline = async (req, res) => {
    const courses = await Course.find({ 'studentIds': req.student._id, isDeleted: false });
    let deadline = [];
    courses.forEach(course => {
        deadline = deadline.concat(getDeadlineOfCourse(course, req.student));
    });

    res.json({
        success: true,
        deadline: _.sortBy(deadline, ['expireTime'])
    });
}

exports.getDeadlineBySubject = async (req, res) => {
    let deadline = getDeadlineOfCourse(req.course, req.student);

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