const _ = require('lodash');
const moment = require('moment');
const { HttpNotFound, HttpUnauthorized, HttpBadRequest } = require('../../utils/errors');
const { getCommonInfo, getUserById } = require('../../services/DataHelpers');
const { findTimeline, findChapterOfQuizBank, findExam } = require('../../services/FindHelpers');
const DETAILS = require("../../constants/AccountDetail");
const { ClientResponsesMessages } = require('../../constants/ResponseMessages');
const { ExamResponseMessages } = ClientResponsesMessages

exports.create = async (req, res) => {
    const course = req.course;

    const timeline = findTimeline(course, req.query.idTimeline);

    const setting = req.body.data.setting;

    const model = {
        name: req.body.data.name,
        content: req.body.data.content,
        setting: {
            startTime: new Date(setting.startTime),
            expireTime: new Date(setting.expireTime),
            questionCount: setting.questionCount,
            timeToDo: setting.timeToDo,
            questionnaires: setting.questionnaires,
            attemptCount: setting.attemptCount
        },
        isDeleted: req.body.data.isDeleted
    };

    const length = timeline.exams.push(model);

    await course.save();

    res.json({
        success: true,
        exam: getCommonInfo(timeline.exams[length - 1]),
        message: ExamResponseMessages.CREATE_SUCCESS
    })
};

exports.find = async (req, res) => {
    const course = req.course;

    const { exam } = findExam(course, req.query.idTimeline, req.params.id, req.isStudent);

    const today = new Date();
    const setting = exam.setting;
    const isRemain = (today <= setting.expireTime);
    const isOpen = (today >= setting.startTime && today <= setting.expireTime)
    const timingRemain = moment(setting.expireTime).from(moment(today));

    if (req.isStudent) {
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
        const submissions = await Promise.all(
            course.studentIds.map(async (idStudent) => {
                const student = await getUserById(idStudent, DETAILS.COMMON);
                const submissions = exam.submissions.filter(value => value.idStudent.equals(student._id));
                if (submissions && submissions.length > 0) {
                    const { _id, grade } = submissions.reduce((previous, current) => {
                        return previous.grade > current.grade ? previous : current;
                    }, { _id: null, grade: 0 })
                    return {
                        _id: _id,
                        student: student,
                        grade: grade,
                        attemptCount: submissions.length
                    }
                } else {
                    return {
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
    const course = req.course;
    const { exam } = findExam(course, req.query.idTimeline, req.params.id);

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
    const course = req.course;

    const timeline = findTimeline(course, req.query.idTimeline);

    const exams = timeline.exams.map(value => getCommonInfo(value));

    res.json({
        success: true,
        exams
    })
};

exports.update = async (req, res) => {
    const course = req.course;

    const { exam } = findExam(course, req.query.idTimeline, req.params.id);

    const data = req.body.data;
    exam.name = data.name
    exam.content = data.content

    const setting = data.setting;
    if (exam.submissions.length > 0 && !(_.isEqual(exam.setting, setting))) {

        throw new HttpUnauthorized(ExamResponseMessages.EXAM_HAS_SUBMISSION);

    } else {
        exam.setting = setting;
    }

    exam.isDeleted = data.isDeleted;

    await course.save()
    res.json({
        success: true,
        message: ExamResponseMessages.UPDATE_SUCCESS,
        exam: getCommonInfo(exam)
    })
};

exports.delete = async (req, res) => {
    const course = req.course;

    const { timeline, exam } = findExam(course, req.query.idTimeline, req.params.id);


    const index = timeline.exams.indexOf(exam);

    timeline.exams.splice(index, 1);

    await course.save();

    res.json({
        success: true,
        message: ExamResponseMessages.DELETE_SUCCESS
    });
};

exports.lock = async (req, res) => {
    const course = req.course;

    const { exam } = findExam(course, req.query.idTimeline, req.params.id);

    exam.isDeleted = !exam.isDeleted;

    await course.save()

    res.json({
        success: true,
        message: ExamResponseMessages.LOCK_MESSAGE(exam),
        exam: getCommonInfo(exam)
    });
};

exports.submitExam = async (req, res) => {
    const course = req.course;

    const { exam } = findExam(course, req.query.idTimeline, req.params.id, true);


    const { submission, totalTime } = await checkSubmission(course, exam, req.params.idSubmission, req.student._id);

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

    await course.save();

    res.send({
        success: true,
        message: ExamResponseMessages.SUBMIT_SUCCESS
    });

}

exports.doExam = async (req, res) => {
    const course = req.course;

    const { exam } = findExam(course, req.query.idTimeline, req.params.id, true);

    const { submission, totalTime } = await checkSubmission(course, exam, req.params.idSubmission, req.student._id);

    const setting = exam.setting;

    const questions = submission.answers.map(value => {

        const questions = Promise.all(setting.questionnaires.reduce(async (result, current) => {

            const chapter = findChapterOfQuizBank(course, current.id);

            const questions = await result;

            questions = questions.concat(chapter.questions);

            return questions;
        }, []));

        const question = questions.find(question => question._id.equals(value.idQuestion));

        return {
            _id: question._id,
            question: question.question,
            typeQuestion: question.typeQuestion,
            answers: question.answers.map(value => { return { _id: value._id, answer: value.answer } })
        }
    });

    const remainTime = setting.timeToDo * 60 * 1000 - totalTime * 1000

    res.json({
        success: true,
        quiz: {
            _id: exam._id,
            name: exam.name,
            timeToDo: remainTime,
            questions: questions
        }
    });
}

exports.attemptExam = async (req, res) => {
    const course = req.course;

    const { exam } = findExam(course, req.query.idTimeline, req.params.id, true);

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
                    await course.save();
                }
            }
            attempt++;
        }
        if (attempt > setting.attemptCount) {

            throw new HttpUnauthorized(ExamResponseMessages.NUMBER_ATTEMPT_RUN_OUT);

        } else {

            const questions = setting.questionnaires.map(questionnaire => {
                const chapter = findChapterOfQuizBank(course, questionnaire.id);

                const questions = _.sampleSize(chapter.questions, questionnaire.questionCount)
                    .map(question => {
                        return {
                            _id: question._id,
                            question: question.question,
                            typeQuestion: question.typeQuestion,
                            answers: question.answers.map(value => { return { _id: value.id, answer: value.answer } })
                        }
                    });
                return questions;
            });

            questions = _.sample(questions);

            const submit = {
                idStudent: req.student._id,
                answers: questions.map(value => {
                    return { idQuestion: value._id }
                }),
                startTime: new Date()
            }
            const index = exam.submissions.push(submit) - 1;
            await course.save();
            res.json({
                idSubmission: exam.submissions[index]._id
            });
        }
    } else {
        if (today < exam.startTime) {
            throw new HttpUnauthorized(ExamResponseMessages.EXAM_NOT_OPEN);
        } else {
            throw new HttpUnauthorized(ExamResponseMessages.EXAM_IS_OVERDUE);
        }
    }
}

const checkSubmission = async (course, exam, idSubmission, idStudent) => {
    const submission =
        exam.submissions.find((submission) => submission._id.equals(idSubmission) &&
            submission.idStudent.equals(idStudent));

    if (!submission) {
        throw new HttpNotFound(ExamResponseMessages.NOT_FOUND_SUBMISSION)
    }

    const setting = exam.setting;

    if (submission.isSubmitted) {
        throw new HttpUnauthorized(ExamResponseMessages.IS_SUBMITTED)
    }
    const today = new Date();
    const totalTime = ((today - submission.startTime) / (1000)).toFixed(0);
    if (totalTime >= setting.timeToDo * 60) {
        submission.isSubmitted = true;
        await course.save();
        throw new HttpUnauthorized(ExamResponseMessages.TIME_OUT);
    }

    return { submission, totalTime };
}