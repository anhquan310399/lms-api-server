const moment = require('moment');
const { HttpNotFound, HttpUnauthorized } = require('../../utils/errors');
const { getCommonInfo, getUserById } = require('../../services/DataHelpers');
const { findTimeline, findAssignment } = require('../../services/FindHelpers');
const { sendMail } = require('../../services/SendMail');
const { MailTemplate } = require('../../utils/mailOptions');
const DETAILS = require("../../constants/AccountDetail");
const { ClientResponsesMessages } = require('../../constants/ResponseMessages');
const { AssignResponseMessages } = ClientResponsesMessages

exports.create = async (req, res) => {
    const course = req.course;
    const timeline = findTimeline(course, req.body.idTimeline);
    const data = req.body.data;
    const model = {
        name: data.name,
        content: data.content,
        setting: {
            startTime: new Date(data.setting.startTime),
            expireTime: new Date(data.setting.expireTime),
            isOverDue: data.setting.isOverDue,
            overDueDate: data.setting.isOverDue ? new Date(data.setting.overDueDate) : null,
            fileSize: data.setting.fileSize,
        },
        attachments: data.file,
        isDeleted: data.isDeleted
    };
    const length = timeline.assignments.push(model);
    await course.save();
    const assignment = getCommonInfo(timeline.assignments[length - 1]);
    res.json({
        success: true,
        assignment,
        message: AssignResponseMessages.CREATE_SUCCESS
    });
};

exports.find = async (req, res) => {
    const course = req.course;
    const { assignment } = findAssignment(course, req.query.idTimeline, req.params.id, req.isStudent);
    const today = new Date();
    const timingRemain = moment(assignment.setting.expireTime).from(moment(today));

    if (req.isStudent) {
        const submission = await assignment.submissions.find(value => value.idStudent.equals(req.user._id));

        let isCanSubmit = false;
        if (today >= assignment.setting.startTime && today < assignment.setting.expireTime) {
            isCanSubmit = true;

        } else if (assignment.setting.isOverDue && today >= assignment.setting.startTime) {
            if (today <= assignment.setting.overDueDate) {
                isCanSubmit = true;
            }
        }

        let gradeStatus = false;
        if (submission && submission.feedBack) {
            gradeStatus = true;
            isCanSubmit = false;
        }
        res.json({
            success: true,
            assignment: {
                _id: assignment._id,
                name: assignment.name,
                content: assignment.content,
                attachments: assignment.attachments,
                submissionStatus: submission ? true : false,
                gradeStatus: gradeStatus,
                setting: assignment.setting,
                isCanSubmit: isCanSubmit,
                timingRemain: timingRemain,
                submission: submission || null
            }
        })
    } else {
        const submissions = await Promise.all(assignment.submissions
            .map(async function (submit) {
                const student = await getUserById(submit.idStudent, DETAILS.COMMON);
                return {
                    _id: submit._id,
                    student: student,
                    submitTime: submit.submitTime,
                    file: submit.file,
                    feedBack: submit.feedBack || null
                };
            }));

        res.json({
            success: true,
            assignment: {
                _id: assignment._id,
                name: assignment.name,
                content: assignment.content,
                isDeleted: assignment.isDeleted,
                attachments: assignment.attachments || null,
                setting: assignment.setting,
                submissionCount: assignment.submissions.length,
                submission: submissions
            }
        });
    }
};

exports.findUpdate = async (req, res) => {
    const course = req.course;
    const { assignment } = findAssignment(course, req.query.idTimeline, req.params.id);

    res.send({
        success: true,
        assignment: {
            _id: assignment._id,
            name: assignment.name,
            content: assignment.content,
            isDeleted: assignment.isDeleted,
            attachments: assignment.attachments || null,
            setting: assignment.setting,
        }
    });

};

exports.findAll = async (req, res) => {
    const course = req.course;
    const timeline = findTimeline(course, req.query.idTimeline, req.isStudent);
    const assignments = await Promise.all(timeline.assignments.reduce(async (result, curAssignment) => {
        result = await result;
        if (curAssignment.isDeleted && req.isStudent) {
            return result;
        } else {
            return [...result,
            {
                _id: value._id,
                name: value.name,
                content: value.content,
                startTime: value.setting.startTime,
                expireTime: value.setting.expireTime
            }]
        }

    }, []));
    res.json({
        success: true,
        assignments
    })
};

exports.update = async (req, res) => {
    const data = req.body.data;
    const course = req.course;
    const { assignment } = findAssignment(course, req.body.idTimeline, req.params.id);

    if (data.name) {
        assignment.name = data.name;
    }
    if (data.content) {
        assignment.content = data.content;
    }
    if (data.setting) {
        assignment.setting = {
            startTime: new Date(data.setting.startTime),
            expireTime: new Date(data.setting.expireTime),
            isOverDue: data.setting.isOverDue,
            overDueDate: data.setting.isOverDue ? new Date(data.setting.overDueDate) : null,
            fileSize: data.setting.fileSize
        }
    }
    assignment.isDeleted = data.isDeleted || false;

    if (data.file && data.file.length > 0) {
        assignment.attachments = data.file;
    }

    await course.save();

    res.json({
        success: true,
        message: AssignResponseMessages.UPDATE_SUCCESS,
        assignment: getCommonInfo(assignment)
    });
};

exports.delete = async (req, res) => {
    const course = req.course;
    const { timeline, assignment } = findAssignment(course, req.query.idTimeline, req.params.id);

    const indexAssignment = timeline.assignments.indexOf(assignment);
    timeline.assignments.splice(indexAssignment, 1);

    await course.save();
    res.json({
        success: true,
        message: AssignResponseMessages.DELETE_SUCCESS
    });
};

exports.lock = async (req, res) => {
    const course = req.course;
    const { assignment } = findAssignment(course, req.query.idTimeline, req.params.id);

    assignment.isDeleted = !assignment.isDeleted;

    await course.save();

    res.send({
        success: true,
        message: AssignResponseMessages.LOCK_MESSAGE(assignment),
        assignment: getCommonInfo(assignment)
    });
};

exports.submit = async (req, res) => {
    const course = req.course;
    const { assignment } = findAssignment(course, req.body.idTimeline, req.params.id, true);

    const today = new Date();
    const setting = assignment.setting;
    if ((today >= setting.startTime && today <= setting.expireTime) ||
        (setting.isOverDue && today <= setting.overDueDate &&
            today >= setting.startTime)) {
        const file = {
            name: req.body.file.name,
            path: req.body.file.path,
            type: req.body.file.type,
        }
        let index = 0;
        const submitted = assignment.submissions.find(value => value.idStudent.equals(req.student._id));
        if (submitted) {
            if (!submitted.feedBack) {
                index = assignment.submissions.indexOf(submitted);
                submitted.submitTime = today;
                submitted.file = file;
            } else {
                throw new HttpUnauthorized(AssignResponseMessages.SUBMISSION_IS_GRADED);
            }
        } else {
            var submission = {
                idStudent: req.student._id,
                submitTime: today,
                file: file
            }
            index = assignment.submissions.push(submission) - 1;
        }
        await course.save();

        const mailOptions = MailTemplate.MAIL_CONFIRM_SUBMIT_ASSIGNMENT(req.student, assignment, course);

        await sendMail(mailOptions);

        res.json({
            success: true,
            submission: assignment.submissions[index]
        });
    } else {
        let message;
        if (today <= setting.startTime) {
            message = AssignResponseMessages.ASSIGNMENT_NOT_OPEN;
        } else {
            message = AssignResponseMessages.ASSIGNMENT_IS_OVERDUE;
        }
        throw new HttpUnauthorized(message);
    }
};

exports.gradeSubmission = async (req, res) => {
    const course = req.course;
    const { assignment } = findAssignment(course, req.body.idTimeline, req.params.id);

    const submitted = assignment.submissions.find(value => value._id.equals(req.params.idSubmission));
    if (!submitted) {
        throw new HttpNotFound(AssignResponseMessages.NOT_FOUND_SUBMISSION);
    }

    submitted.feedBack = {
        grade: req.body.grade,
        gradeOn: new Date(),
        gradeBy: req.teacher._id
    }

    await course.save();

    const student = await getUserById(submitted.idStudent, DETAILS.COMMON);

    const mailOptions = MailTemplate.MAIL_NOTIFY_SUBMISSION_IS_GRADED(student, assignment, course);

    await sendMail(mailOptions);

    res.json({
        success: true,
        message: AssignResponseMessages.GRADE_SUBMISSION_SUCCESS(student),
        feedBack: submitted.feedBack
    });
}

exports.commentFeedback = async (req, res) => {
    const course = req.course;
    const { assignment } = findAssignment(course, req.body.idTimeline, req.params.id, req.isStudent);

    const submitted = assignment.submissions.find(value => value._id.equals(req.params.idSubmission));
    if (!submitted) {
        throw new HttpNotFound(AssignResponseMessages.NOT_FOUND_SUBMISSION);
    }
    if (typeof submitted.feedBack == 'undefined') {
        throw new HttpUnauthorized(AssignResponseMessages.SUBMISSION_IS_GRADED_CANT_COMMENT);
    }
    submitted.feedBack.comments.push({
        content: req.body.comment,
        idUser: req.user._id
    })

    await course.save();
    const comments = await Promise.all(submitted.feedBack.comments.map(async (comment) => {
        const user = await getUserById(comment.idUser, DETAILS.COMMON);
        return {
            _id: comment._id,
            user: user,
            content: comment.content
        }
    }));
    res.json({
        success: true,
        message: AssignResponseMessages.COMMENT_FEEDBACK_SUBMISSION_SUCCESS,
        comments: comments
    });
}