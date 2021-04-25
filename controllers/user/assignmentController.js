const mongoose = require("mongoose");
const User = mongoose.model("User");
const moment = require('moment');
const { HttpNotFound, HttpUnauthorized } = require('../../utils/errors');
const { getCommonData } = require('../../services/DataMapper');
const { findTimeline, findAssignment } = require('../../services/DataSearcher');
const { sendMail } = require('../../services/SendMail');
const { MailOptions } = require('../../utils/mailOptions');
const DETAILS = require("../../constants/AccountDetail");
const PRIVILEGES = require("../../constants/PrivilegeCode");

exports.create = async (req, res) => {
    const subject = req.subject;
    const timeline = findTimeline(subject, req);
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
    let length = timeline.assignments.push(model);
    await subject.save();
    const assignment = getCommonData(timeline.assignments[length - 1]);
    res.json({
        success: true,
        assignment
    });
};

exports.find = async (req, res) => {
    const subject = req.subject;
    const { assignment } = findAssignment(subject, req);
    const today = new Date();
    const timingRemain = moment(assignment.setting.expireTime).from(moment(today));

    if (req.user.idPrivilege === PRIVILEGES.STUDENT || req.user.idPrivilege === PRIVILEGES.REGISTER) {
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
        let submissions = await Promise.all(assignment.submissions
            .map(async function (submit) {
                var student = await User.findById(submit.idStudent, DETAILS.COMMON)
                    .then(value => {
                        return value
                    });
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
    const subject = req.subject;
    const { assignment } = findAssignment(subject, req);

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
    const subject = req.subject;
    const timeline = findTimeline(subject, req);
    const assignments = await Promise.all(timeline.assignments.map(async (value) => {
        return {
            _id: value._id,
            name: value.name,
            content: value.content,
            startTime: value.setting.startTime,
            expireTime: value.setting.expireTime
        }
    }));
    res.json({
        success: true,
        assignments
    })
};

exports.update = async (req, res) => {
    const data = req.body.data;
    const subject = req.subject;
    const { assignment } = findAssignment(subject, req);
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

    await subject.save();

    res.json({
        success: true,
        message: 'Update assignment successfully!',
        assignment: getCommonData(assignment)
    });
};

exports.delete = async (req, res) => {
    const subject = req.subject;
    const { timeline, assignment } = findAssignment(subject, req);
    const indexAssignment = timeline.assignments.indexOf(assignment);
    timeline.assignments.splice(indexAssignment, 1);

    await subject.save();
    res.json({
        success: true,
        message: "Delete Assignment Successfully!"
    });
};

exports.hideOrUnhide = async (req, res) => {
    const subject = req.subject;
    const { assignment } = findAssignment(subject, req);
    assignment.isDeleted = !assignment.isDeleted;

    await subject.save();
    const message = `${assignment.isDeleted ? 'Hide' : 'Unhide'} assignment ${assignment.name} successfully!`;
    res.send({
        success: true,
        message,
        assignment: getCommonData(assignment)
    });
};

exports.submit = async (req, res) => {
    const subject = req.subject;
    const { assignment } = findAssignment(subject, req);

    const today = new Date();
    const setting = assignment.setting;
    if ((today >= setting.startTime && today <= setting.expireTime) ||
        (setting.isOverDue && today <= setting.overDueDate &&
            today >= setting.startTime)) {
        const file = {
            name: req.body.file.name,
            path: req.body.file.path,
            type: req.body.file.type,
            uploadDay: new Date()
        }
        var index = 0;
        const submitted = assignment.submissions.find(value => value.idStudent.equals(req.student._id));
        if (submitted) {
            if (!submitted.feedBack) {
                index = assignment.submissions.indexOf(submitted);
                submitted.submitTime = today;
                submitted.file = file;
            } else {
                throw new HttpUnauthorized("Assignment was graded, can't submit!");
            }
        } else {
            var submission = {
                idStudent: req.student._id,
                submitTime: today,
                file: file
            }
            index = assignment.submissions.push(submission) - 1;
        }
        await subject.save();

        const mailOptions = new MailOptions({
            to: req.student.emailAddress,
            subject: 'No reply this email',
            text: `You currently submit to assignment "${assignment.name}" in subject "${subject.name}"`
        });
        sendMail(mailOptions);
        res.json({
            success: true,
            submission: assignment.submissions[index]
        });
    } else {
        let message = "";
        if (today <= setting.startTime) {
            message = "The assignment has been not opened";
        } else {
            message = "The assignment is overdue";
        }
        throw new HttpUnauthorized(message);
    }
};

exports.gradeSubmission = async (req, res) => {
    const subject = req.subject;
    const { assignment } = findAssignment(subject, req);

    const submitted = assignment.submissions.find(value => value._id.equals(req.params.idSubmission));
    if (!submitted) {
        throw new HttpNotFound("Not found submission");
    }
    submitted.feedBack = {
        grade: req.body.grade,
        gradeOn: new Date(),
        gradeBy: req.lecture._id
    }

    await subject.save();
    const student = await User.findById(submitted.idStudent, DETAILS.COMMON);

    const mailOptions = new MailOptions({
        to: student.emailAddress,
        subject: 'No reply this email',
        text: `Your submission for assignment "${assignment.name}" in subject "${subject.name}" is currently graded`
    });
    sendMail(mailOptions);

    res.json({
        success: true,
        message: `Grade submission of student with code: ${student.code} successfully!`,
        feedBack: submitted.feedBack
    });
}

exports.commentFeedback = async (req, res) => {
    const subject = req.subject;
    const { assignment } = findAssignment(subject, req);

    const submitted = assignment.submissions.find(value => value._id.equals(req.params.idSubmission));
    if (!submitted) {
        throw new HttpNotFound("Not found submission");
    }
    if (typeof submitted.feedBack == 'undefined') {
        throw new HttpUnauthorized("The submission hasn't been graded. Can't comment");
    }
    submitted.feedBack.comments.push({
        content: req.body.comment,
        idUser: req.user._id
    })

    await subject.save();
    const comments = await Promise.all(submitted.feedBack.comments.map(async (comment) => {
        const user = await User.findById(comment.idUser, DETAILS.COMMON);
        return {
            _id: comment._id,
            user: user,
            content: comment.content
        }
    }));
    res.json({
        success: true,
        message: 'Comment feedback of submission successfully!',
        comments: comments
    });
}