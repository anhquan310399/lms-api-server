const mongoose = require("mongoose");
const { HttpNotFound, HttpUnauthorized, HttpBadRequest } = require('../../utils/errors');
const { getCommonInfo } = require('../../services/DataHelpers');
const { findTimeline, findSurvey } = require('../../services/FindHelpers');
const moment = require('moment');
const { ClientResponsesMessages } = require('../../constants/ResponseMessages');
const { SurveyResponseMessages } = ClientResponsesMessages

const createQuestionnaire = async (questions) => {
    if (!questions || questions.length === 0) {
        throw new HttpBadRequest(SurveyResponseMessages.QUESTIONS_NOT_VALID)
    }
    const questionnaire = await Promise.all(questions.map(async (question) => {
        if (question.typeQuestion === 'choice' || question.typeQuestion === 'multiple') {
            let answer = await question.answer.map(value => {
                return {
                    _id: new mongoose.Types.ObjectId,
                    content: value
                }
            })
            return {
                identity: question.identity,
                content: question.content,
                typeQuestion: question.typeQuestion,
                answer: answer
            }
        } else if (question.typeQuestion === 'fill') {
            return {
                identity: question.identity,
                content: question.content,
                typeQuestion: question.typeQuestion,
            }
        }
    }));

    return questionnaire;
}

exports.create = async (req, res) => {
    const course = req.course;

    const timeline = findTimeline(course, req.body.idTimeline);

    const data = req.body.data;

    const questionnaire = await createQuestionnaire(data.questions)

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
    const setting = survey.setting;
    const isRemain = today <= setting.expireTime;
    const isOpen = (today >= setting.startTime && today <= setting.expireTime)
    const timeRemain = moment(setting.expireTime).from(moment(today));

    if (req.isStudent) {
        const reply = survey.responses.find(value => value.idStudent.equals(req.user._id));
        res.json({
            success: true,
            survey: {
                _id: survey._id,
                name: survey.name,
                description: survey.description,
                setting: survey.setting,
                isOpen: isOpen,
                isRemain: isRemain,
                timeRemain: timeRemain,
                canAttempt: !reply && isOpen
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
                isOpen: isOpen,
                isRemain: isRemain,
                timeRemain: timeRemain,
                responses: survey.responses.length
            }
        })
    }

}

exports.findUpdate = async (req, res) => {
    const course = req.course;

    const { survey } = findSurvey(course, req.query.idTimeline, req.params.id);

    res.json({
        success: true,
        survey: {
            _id: survey._id,
            name: survey.name,
            description: survey.description,
            setting: survey.setting,
            questionnaire: survey.questionnaire,
            isDeleted: survey.isDeleted
        }
    })
}

exports.findAll = async (req, res) => {
    const course = req.course;

    const timeline = findTimeline(course, req.query.idTimeline, req.isStudent);

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

    const { survey } = findSurvey(course, req.body.idTimeline, req.params.id);

    const data = req.body.data;

    survey.name = data.name;
    survey.description = data.description;
    survey.setting = data.setting;

    survey.isDeleted = data.isDeleted;

    if (data.questions) {

        if (survey.responses.length > 0) {
            throw new HttpBadRequest(SurveyResponseMessages.SURVEY_HAS_RESPONSES);
        }

        const questionnaire = await createQuestionnaire(data.questions);

        survey.questionnaire = questionnaire;
    }

    await course.save();

    res.json({
        success: true,
        message: SurveyResponseMessages.UPDATE_SUCCESS,
        survey: getCommonInfo(survey)
    })

}

exports.lock = async (req, res) => {
    const course = req.course;

    const { survey } = findSurvey(course, req.query.idTimeline, req.params.id);


    survey.isDeleted = !survey.isDeleted;

    await course.save();

    res.send({
        success: true,
        message: SurveyResponseMessages.LOCK_MESSAGE(survey),
        survey: getCommonInfo(survey)
    })
}

exports.delete = async (req, res) => {
    const course = req.course;

    const { timeline, survey } = findSurvey(course, req.query.idTimeline, req.params.id);

    const index = timeline.surveys.indexOf(survey);
    timeline.surveys.splice(index, 1);

    await course.save()
    res.json({
        success: true,
        message: SurveyResponseMessages.DELETE_SUCCESS
    })
}

exports.attemptSurvey = async (req, res) => {
    const course = req.course;

    const { survey } = findSurvey(course, req.query.idTimeline, req.params.id, true);

    const reply = survey.responses.find(value => value.idStudent.equals(req.student._id));
    if (reply) {
        throw new HttpUnauthorized(SurveyResponseMessages.SURVEY_ALREADY_REPLIED)
    }

    res.send({
        success: true,
        survey: {
            _id: survey._id,
            name: survey.name
        },
        questionnaire: survey.questionnaire
    })
}

exports.replySurvey = async (req, res) => {
    const course = req.course;

    const { survey } = findSurvey(course, req.body.idTimeline, req.params.id, true);

    const replied = survey.responses.find(value => value.idStudent.equals(req.student._id));

    if (replied) {
        throw new HttpUnauthorized(SurveyResponseMessages.SURVEY_ALREADY_REPLIED);
    }

    const data = req.body.data;

    const reply = {
        idStudent: req.student._id,
        answerSheet: data,
        timeResponse: new Date()
    }

    survey.responses.push(reply);

    await course.save();

    res.json({
        success: true,
        message: SurveyResponseMessages.REPLY_SURVEY_SUCCESS,
    });
}

exports.viewResponse = async (req, res) => {
    const course = req.course;

    const { survey } = findSurvey(course, req.query.idTimeline, req.params.id, true);

    const reply = survey.responses.find(value => value.idStudent.equals(req.student._id));

    if (!reply) {
        throw new HttpNotFound(SurveyResponseMessages.SURVEY_NOT_REPLIED);
    }

    res.send({
        success: true,
        survey: {
            _id: survey._id,
            name: survey.name
        },
        questionnaire: survey.questionnaire,
        response: reply
    })
}

exports.viewAllResponse = async (req, res) => {
    const course = req.course;

    const { survey } = findSurvey(course, req.query.idTimeline, req.params.id, req.isStudent);

    const questionnaire = survey.questionnaire;

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
            content: question.content,
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