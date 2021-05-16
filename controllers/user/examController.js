const mongoose = require("mongoose");
const User = mongoose.model("User");
const _ = require('lodash');
const moment = require('moment');
const { HttpNotFound, HttpUnauthorized, HttpBadRequest } = require('../../utils/errors');
const { getCommonData } = require('../../services/DataMapper');
const { findTimeline, findQuizBank, findExam } = require('../../services/DataSearcher');
const DETAILS = require("../../constants/AccountDetail");
const PRIVILEGES = require("../../constants/PrivilegeCode");

exports.create = async (req, res) => {
    const subject = req.subject;

    const timeline = findTimeline(subject, req);

    const setting = req.body.data.setting;

    const chapter = findQuizBank(subject, setting.code);
    if (chapter.questions.length < setting.questionCount) {
        throw new HttpBadRequest("The question count you set is more then question count in quiz");
    }
    const model = {
        name: req.body.data.name,
        content: req.body.data.content,
        setting: {
            startTime: new Date(setting.startTime),
            expireTime: new Date(setting.expireTime),
            questionCount: setting.questionCount,
            timeToDo: setting.timeToDo,
            code: chapter._id,
            attemptCount: setting.attemptCount
        },
        isDeleted: req.body.data.isDeleted
    };

    const length = timeline.exams.push(model);
    await subject.save();
    res.json({
        success: true,
        exam: getCommonData(timeline.exams[length - 1])
    })
};

exports.find = async (req, res) => {
    const subject = req.subject;

    const { exam } = findExam(subject, req);

    const today = new Date();
    const setting = exam.setting;
    const isRemain = (today <= setting.expireTime);
    const isOpen = (today >= setting.startTime && today <= setting.expireTime)
    const timingRemain = moment(setting.expireTime).from(moment(today));

    if (req.user.idPrivilege === PRIVILEGES.STUDENT || req.user.idPrivilege === PRIVILEGES.REGISTER) {
        let submissions = exam.submissions.filter(value => value.idStudent.equals(req.user._id));
        let isContinue = false;
        let time = 1;
        submissions = await Promise.all(submissions.map(async (submission, index) => {
            if (index = submissions.length) {
                if (today >= setting.startTime && today < setting.expireTime) {
                    if (!submission.isSubmitted) {
                        let totalTime = ((today - submission.startTime) / (1000)).toFixed(0);
                        console.log(totalTime);
                        if (totalTime <= setting.timeToDo * 60) {
                            isContinue = true;
                        }
                    }
                }
            }

            return {
                _id: submission._id,
                student: {
                    _id: req.user._id,
                    code: req.user.code,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName,
                    urlAvatar: req.user.urlAvatar,
                },
                grade: (submission.isSubmitted || !isContinue) ? submission.grade : null,
                isSubmitted: submission.isSubmitted,
                isContinue: isContinue,
                time: time++,
            }
        }));
        let isAttempt = false;
        const attemptAvailable = setting.attemptCount - submissions.length;
        if (!isContinue && attemptAvailable > 0) {
            if (today >= setting.startTime && today < setting.expireTime) {
                isAttempt = true;
            }
        }

        res.json({
            success: true,
            exam: {
                _id: exam._id,
                name: exam.name,
                content: exam.content,
                setting: exam.setting,
                isRemain: isRemain,
                isOpen: isOpen,
                timingRemain: timingRemain,
                isAttempt: isAttempt,
                attemptAvailable: attemptAvailable,
                submissions: submissions
            }
        })
    } else {
        let key = 0;
        const submissions = await Promise.all(
            subject.studentIds.map(async (idStudent) => {
                const student = await User.findById(idStudent, DETAILS.COMMON);
                const submissions = exam.submissions.filter(value => value.idStudent.equals(student._id));
                if (submissions && submissions.length > 0) {
                    const { _id, grade } = submissions.reduce((previous, current) => {
                        return previous.grade > current.grade ? previous : current;
                    }, { _id: null, grade: 0 })
                    return {
                        key: key++,
                        _id: _id,
                        student: student,
                        grade: grade,
                        attemptCount: submissions.length
                    }
                } else {
                    return {
                        key: key++,
                        _id: null,
                        student: student,
                        grade: isRemain ? null : 0,
                        attemptCount: 0
                    }
                }
            }));

        res.json({
            success: true,
            exam: {
                _id: exam._id,
                name: exam.name,
                content: exam.content,
                isDeleted: exam.isDeleted,
                isOpen: isOpen,
                setting: exam.setting,
                isRemain: isRemain,
                timingRemain: timingRemain,
                submissions: submissions
            }
        });
    }
};

exports.findUpdate = async (req, res) => {
    const subject = req.subject;
    const { exam } = findExam(subject, req);
    res.json({
        success: true,
        exam: {
            _id: exam._id,
            name: exam.name,
            content: exam.content,
            isDeleted: exam.isDeleted,
            setting: exam.setting,
        }
    });

};

exports.findAll = async (req, res) => {
    const subject = req.subject;
    const timeline = findTimeline(subject, req);
    const exams = timeline.exams.map(value => getCommonData(value));

    res.json({
        success: true,
        exams
    })
};

exports.update = async (req, res) => {
    const subject = req.subject;
    const { exam } = findExam(subject, req);
    const data = req.body.data;
    if (data.name) { exam.name = data.name };
    if (data.content) { exam.content = data.content };
    if (data.setting) {
        const setting = data.setting;
        if (exam.submissions.length > 0 && !(_.isEqual(exam.setting, setting))) {
            throw new HttpBadRequest(`Exam has already submission. Can't change setting of exam!`)
        } else {
            const chapter = findQuizBank(subject, setting.code);
            if (chapter.questions.length < setting.questionCount) {
                throw new HttpBadRequest("The question count you set is more then question count in quiz");
            }
            exam.setting = {
                questionCount: setting.questionCount,
                timeToDo: setting.timeToDo,
                code: chapter._id,
                attemptCount: setting.attemptCount,
                startTime: new Date(setting.startTime),
                expireTime: new Date(setting.expireTime)
            }
        }
    };

    exam.isDeleted = data.isDeleted || false;

    await subject.save()
    res.json({
        success: true,
        message: 'Update exam successfully!',
        exam: getCommonData(exam)
    })
};

exports.delete = async (req, res) => {
    const subject = req.subject;

    const { exam, timeline } = findExam(subject, req);

    const index = timeline.exams.indexOf(exam);

    timeline.exams.splice(index, 1);
    await subject.save()
    res.json({
        success: true,
        message: "Delete Exam Successfully!"
    });
};

exports.hideOrUnhide = async (req, res) => {
    const subject = req.subject;

    const { exam } = findExam(subject, req);
    exam.isDeleted = !exam.isDeleted;

    await subject.save()
    const message = `${exam.isDeleted ? 'Hide' : 'Unhide'} exam ${exam.name} successfully!`;;

    res.json({
        success: true,
        message,
        exam: getCommonData(exam)
    });
};

exports.submitExam = async (req, res) => {
    const subject = req.subject;
    const { exam } = findExam(subject, req);
    const { submission, totalTime } = await checkSubmission(subject, exam, req.params.idSubmission, req.student._id);
    const data = req.body.data;
    submission.answers = submission.answers.map(value => {
        let answer = data.find(answer => value.idQuestion.equals(answer.idQuestion));
        let idAnswer = answer ? answer.idAnswer : '';
        return {
            idQuestion: value.idQuestion,
            idAnswer: idAnswer
        }
    });
    submission.isSubmitted = true;
    await subject.save()
    res.send({
        success: true,
        message: "Submit submission successfully!"
    });

}

exports.doExam = async (req, res) => {
    const subject = req.subject;
    const { exam } = findExam(subject, req);
    const { submission, totalTime } = await checkSubmission(subject, exam, req.params.idSubmission, req.student._id);
    const setting = exam.setting;
    const questions = submission.answers.map(value => {
        const quizBank = subject.quizBank.find(bank => bank._id.equals(setting.code));
        const question = quizBank.questions.find(ques => ques._id.equals(value.idQuestion));
        return {
            _id: question._id,
            question: question.question,
            typeQuestion: question.typeQuestion,
            answers: question.answers.map(value => { return { _id: value._id, answer: value.answer } })
        }
    })
    res.json({
        success: true,
        quiz: {
            _id: exam._id,
            name: exam.name,
            timeToDo: setting.timeToDo * 60 * 1000 - totalTime * 1000,
            questions: questions
        }
    });

}

exports.attemptExam = async (req, res) => {
    const subject = req.subject;
    const { exam } = findExam(subject, req);
    const today = new Date();
    const setting = exam.setting;
    if (today >= setting.startTime && today < setting.expireTime) {
        const submissions = exam.submissions.filter(value => value.idStudent.equals(req.student._id));
        let attempt = submissions.length;
        if (attempt > 0) {
            const submission = submissions[attempt - 1];
            if (!submission.isSubmitted) {
                const totalTime = ((today - submission.startTime) / (1000)).toFixed(0);
                if (totalTime < setting.timeToDo * 60) {
                    return res.json({
                        idSubmission: submission._id
                    })
                } else {
                    submission.isSubmitted = true;
                    await subject.save();
                }
            }
            attempt++;
        }
        if (attempt > setting.attemptCount) {
            throw new HttpUnauthorized("Đã vượt quá số lần tham gia!");
        } else {
            const quizBank = subject.quizBank.find(value => value._id.equals(setting.code));
            if (!quizBank) {
                throw new HttpNotFound("Not found questionnaire")
            }
            const questions = _.sampleSize(quizBank.questions, setting.questionCount)
                .map(value => {
                    return {
                        _id: value._id,
                        question: value.question,
                        typeQuestion: value.typeQuestion,
                        answers: value.answers.map(value => { return { _id: value.id, answer: value.answer } })
                    }
                });

            const submit = {
                idStudent: req.student._id,
                answers: questions.map(value => {
                    return { idQuestion: value._id }
                }),
                startTime: new Date()
            }
            const index = exam.submissions.push(submit) - 1;
            await subject.save();
            res.json({
                idSubmission: exam.submissions[index]._id
            });
        }
    } else {
        if (today < exam.startTime) {
            throw new HttpUnauthorized("Chưa đến thời gian làm bài");
        } else {
            throw new HttpUnauthorized("Đã quá thời hạn làm bài!");
        }
    }
}

const checkSubmission = async (subject, exam, idSubmission, idStudent) => {
    const submission =
        exam.submissions.find((value) => value._id.equals(idSubmission) &&
            value.idStudent.equals(idStudent));

    if (!submission) {
        throw new HttpNotFound("Not found submission!")
    }

    const setting = exam.setting;

    if (submission.isSubmitted) {
        throw new HttpUnauthorized("You have already submitted!")
    }
    const today = new Date();
    const totalTime = ((today - submission.startTime) / (1000)).toFixed(0);
    if (totalTime >= setting.timeToDo * 60) {
        submission.isSubmitted = true;
        await subject.save();
        throw new HttpUnauthorized("Đã hết giờ làm bài");
    }

    return { submission, totalTime };
}