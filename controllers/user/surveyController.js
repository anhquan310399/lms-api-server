const { HttpNotFound, HttpUnauthorized, HttpBadRequest } = require('../../utils/errors');
const { getCommonInfo } = require('../../services/DataHelpers');
const { findTimeline, findSurvey, findSurveyBank } = require('../../services/FindHelpers');
const moment = require('moment');
const PRIVILEGES = require("../../constants/PrivilegeCode");
const { ClientResponsesMessages } = require('../../constants/ResponseMessages');
const { SurveyResponseMessages } = ClientResponsesMessages

const createQuestionnaire = (questions) => {

}

exports.create = async (req, res) => {
    const course = req.course;

    const timeline = findTimeline(course, req.query.idTimeline);

    const data = req.body.data;

    const questionnaire = createQuestionnaire(data.questions)

    const model = {
        name: data.name,
        description: data.description,
        setting: data.setting,
        questionnaire: questionnaire,
        isDeleted: data.isDeleted,
    };
    const length = timeline.surveys.push(model);

    await course.save();

    res.json({
        success: true,
        message: SurveyResponseMessages.CREATE_SUCCESS,
        survey: getCommonInfo(timeline.surveys[length - 1])
    });
};

exports.find = async (req, res) => {
    const course = req.course;

    const { survey } = findSurvey(course, req.query.idTimeline, req.params.id, req.isStudent);

    const today = new Date();
    const isRemain = today > survey.expireTime ? false : true;
    const timeRemain = moment(survey.expireTime).from(moment(today));

    if (req.isStudent) {
        const reply = survey.responses.find(value => value.idStudent.equals(req.user._id));
        res.json({
            success: true,
            survey: {
                _id: survey._id,
                name: survey.name,
                description: survey.description,
                expireTime: survey.expireTime,
                isRemain: isRemain,
                timeRemain: timeRemain,
                canAttempt: reply ? false : true
            }
        })
    } else {
        res.json({
            success: true,
            survey: {
                _id: survey._id,
                name: survey.name,
                description: survey.description,
                expireTime: survey.expireTime,
                isRemain: isRemain,
                timeRemain: timeRemain,
                responses: survey.responses.length
            }
        })
    }

}

exports.findUpdate = async (req, res) => {
    const course = req.course;

    const { survey } = findSurvey(course, req);

    res.json({
        success: true,
        survey: {
            _id: survey._id,
            name: survey.name,
            description: survey.description,
            expireTime: survey.expireTime,
            code: survey.code,
            isDeleted: survey.isDeleted
        }
    })
}

exports.findAll = async (req, res) => {
    const course = req.course;

    const timeline = findTimeline(course, req);
    const surveys = timeline.surveys.map(survey => {
        return getCommonInfo(survey);
    })
    res.send({
        success: true,
        surveys
    })

}

exports.update = async (req, res) => {
    const course = req.course;
    const { survey } = findSurvey(course, req);
    const data = req.body.data;
    if (data.name) { survey.name = data.name; }
    if (data.description) { survey.description = data.description; }
    if (data.expireTime) { survey.expireTime = data.expireTime; }
    if (data.code && survey.code.equals(data.code)) {
        if (survey.responses.length > 0) {
            throw new HttpBadRequest("Survey has already responses. Can't change questionnaire of survey");
        } else {
            const surveyBank = findSurveyBank(course, data.code);
            survey.code = surveyBank._id;
        }
    }
    survey.isDeleted = data.isDeleted || false;

    await course.save()
    res.json({
        success: true,
        message: 'Update survey successfully!',
        survey: getCommonInfo(survey)
    })

}

exports.hideOrUnhide = async (req, res) => {
    const course = req.course;

    const { survey } = findSurvey(course, req);

    survey.isDeleted = !survey.isDeleted;

    await course.save()
    const message = `${survey.isDeleted ? 'Hide' : 'Unhide'} survey ${survey.name} successfully!`;
    res.send({
        success: true,
        message: message,
        survey: getCommonInfo(survey)
    })
}

exports.delete = async (req, res) => {
    const course = req.course;

    const { survey, timeline } = findSurvey(course, req);

    const index = timeline.surveys.indexOf(survey);
    timeline.surveys.splice(index, 1);

    await course.save()
    res.json({
        success: true,
        message: "Delete survey successfully!"
    })
}

exports.attemptSurvey = async (req, res) => {
    const course = req.course;

    const { survey } = findSurvey(course, req);

    const reply = survey.responses.find(value => value.idStudent.equals(req.student._id));
    if (reply) {
        throw new HttpUnauthorized(`You have already reply survey ${survey.name}`)
    }
    const questionnaire = course.surveyBank.find(value => value._id.equals(survey.code));

    res.send({
        success: true,
        survey: {
            _id: survey._id,
            name: survey.name
        },
        questionnaire: questionnaire
    })
}

exports.replySurvey = async (req, res) => {
    const course = req.course;

    const { survey } = findSurvey(course, req);

    const replied = survey.responses.find(value => value.idStudent.equals(req.student._id));
    if (replied) {
        throw new HttpUnauthorized(`You have already reply survey ${survey.name}`)
    }

    const data = req.body.data;

    const reply = {
        idStudent: req.student._id,
        answerSheet: data,
        timeResponse: new Date()
    }
    survey.responses.push(reply);

    await course.save()
    res.json({
        success: true,
        message: `Reply survey ${survey.name} successfully!`,
    });
}

exports.viewResponse = async (req, res) => {
    const course = req.course;

    const { survey } = findSurvey(course, req);

    const reply = survey.responses.find(value => value.idStudent.equals(req.student._id));
    if (!reply) {
        throw new HttpNotFound(`You have not already reply survey ${survey.name}`)
    }
    const questionnaire = course.surveyBank
        .find(value => value._id.equals(survey.code)).questions;

    res.send({
        success: true,
        survey: {
            _id: survey._id,
            name: survey.name
        },
        questionnaire: questionnaire,
        response: reply
    })
}

exports.viewAllResponse = async (req, res) => {
    const course = req.course;

    const { survey } = findSurvey(course, req);

    const questionnaire = course.surveyBank
        .find(value => value._id.equals(survey.code)).questions;
    const result = await Promise.all(questionnaire.map(async (question) => {
        let answer;
        if (question.typeQuestion === 'choice') {
            answer = await Promise.all(question.answer.map(async (answer) => {
                let count = 0;
                survey.responses.forEach(reply => {
                    reply.answerSheet.forEach(answerSheet => {
                        if (!question._id.equals(answerSheet.idQuestion)) {
                            return;
                        }
                        if (answer._id.equals(answerSheet.answer)) {
                            count++;
                        }
                    })
                });
                let percent = ((count / survey.responses.length) * 100).toFixed(0) + "%";
                return {
                    _id: answer._id,
                    content: answer.content,
                    total: count,
                    percent: percent
                }
            }))
        } else if (question.typeQuestion === 'multiple') {
            answer = await Promise.all(question.answer.map(async (answer) => {
                let count = 0;
                survey.responses.forEach(reply => {
                    reply.answerSheet.forEach(answerSheet => {
                        if (!question._id.equals(answerSheet.idQuestion)) {
                            return;
                        }
                        answerSheet.answer.forEach(idAnswer => {
                            if (answer._id.equals(idAnswer)) {
                                count++;
                            }
                        });
                    })
                });
                let percent = ((count / survey.responses.length) * 100).toFixed(0) + "%";
                return {
                    _id: answer._id,
                    content: answer.content,
                    total: count,
                    percent: percent
                }
            }))
        } else {
            answer = [];
            survey.responses.forEach(reply => {
                reply.answerSheet.forEach(answerSheet => {
                    if (!question._id.equals(answerSheet.idQuestion)) {
                        return;
                    }
                    answer = answer.concat(answerSheet.answer);
                })
            })
        }
        return {
            question: question.question,
            typeQuestion: question.typeQuestion,
            answer: answer
        };
    }))

    res.json({
        success: true,
        survey: {
            _id: survey._id,
            name: survey.name
        },
        totalResponses: survey.responses.length,
        questionnaire: result
    });
}