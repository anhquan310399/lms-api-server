const { HttpNotFound, HttpUnauthorized, HttpBadRequest } = require('../utils/errors');
const { getCommonData } = require('../services/DataMapper');
const { findTimeline, findSurvey, findSurveyBank } = require('../services/DataSearcher');

exports.create = async(req, res) => {
    const subject = req.subject;
    const timeline = findTimeline(subject, req);
    const data = req.body.data;
    const surveyBank = findSurveyBank(subject, data.code);
    const model = {
        name: data.name,
        description: data.description,
        code: surveyBank._id,
        expireTime: new Date(data.expireTime),
        isDeleted: data.isDeleted || false
    };
    const length = timeline.surveys.push(model);
    await subject.save();
    res.json({
        success: true,
        message: "Create survey successfully!",
        survey: getCommonData(timeline.surveys[length - 1])
    });
};

exports.find = async(req, res) => {
    const subject = req.subject;
    const { survey } = findSurvey(subject, req);

    const today = new Date();
    const isRemain = today > survey.expireTime ? false : true;
    const timeRemain = today - survey.expireTime.getTime();
    if (req.idPrivilege === 'student') {
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

exports.findUpdate = async(req, res) => {
    const subject = req.subject;

    const { survey } = findSurvey(subject, req);

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

exports.findAll = async(req, res) => {
    const subject = req.subject;

    const timeline = findTimeline(subject, req);
    const surveys = timeline.surveys.map(survey => {
        return getCommonData(survey);
    })
    res.send({
        success: true,
        surveys
    })

}

exports.update = async(req, res) => {
    const subject = req.subject;
    const { survey } = findSurvey(subject, req);
    const data = req.body.data;
    if (data.name) { survey.name = data.name; }
    if (data.description) { survey.description = data.description; }
    if (data.expireTime) { survey.expireTime = data.expireTime; }
    if (data.code && survey.code.equals(data.code)) {
        if (survey.responses.length > 0) {
            throw new HttpBadRequest("Survey has already responses. Can't change questionnaire of survey");
        } else {
            const surveyBank = findSurveyBank(subject, data.code);
            survey.code = surveyBank._id;
        }
    }
    survey.isDeleted = data.isDeleted || false;

    await subject.save()
    res.json({
        success: true,
        message: 'Update survey successfully!',
        survey: getCommonData(survey)
    })

}

exports.hideOrUnhide = async(req, res) => {
    const subject = req.subject;

    const { survey } = findSurvey(subject, req);

    survey.isDeleted = !survey.isDeleted;

    await subject.save()
    const message = `${survey.isDeleted?'Hide':'Unhide'} survey ${survey.name} successfully!`;
    res.send({
        success: true,
        message: message,
        survey: getCommonData(survey)
    })
}

exports.delete = async(req, res) => {
    const subject = req.subject;

    const { survey, timeline } = findSurvey(subject, req);

    const index = timeline.surveys.indexOf(survey);
    timeline.surveys.splice(index, 1);

    await subject.save()
    res.json({
        success: true,
        message: "Delete survey successfully!"
    })
}

exports.attemptSurvey = async(req, res) => {
    const subject = req.subject;

    const { survey } = findSurvey(subject, req);

    const reply = survey.responses.find(value => value.idStudent.equals(req.student._id));
    if (reply) {
        throw new HttpUnauthorized(`You have already reply survey ${survey.name}`)
    }
    const questionnaire = subject.surveyBank.find(value => value._id.equals(survey.code));

    res.send({
        success: true,
        survey: {
            _id: survey._id,
            name: survey.name
        },
        questionnaire: questionnaire
    })
}

exports.replySurvey = async(req, res) => {
    const subject = req.subject;

    const { survey } = findSurvey(subject, req);

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

    await subject.save()
    res.json({
        success: true,
        message: `Reply survey ${survey.name} successfully!`,
    });
}

exports.viewResponse = async(req, res) => {
    const subject = req.subject;

    const { survey } = findSurvey(subject, req);

    const reply = survey.responses.find(value => value.idStudent.equals(req.student._id));
    if (!reply) {
        throw new HttpNotFound(`You have not already reply survey ${survey.name}`)
    }
    const questionnaire = subject.surveyBank
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

exports.viewAllResponse = async(req, res) => {
    const subject = req.subject;

    const { survey } = findSurvey(subject, req);

    const questionnaire = subject.surveyBank
        .find(value => value._id.equals(survey.code)).questions;
    const result = await Promise.all(questionnaire.map(async(question) => {
        let answer;
        if (question.typeQuestion === 'choice') {
            answer = await Promise.all(question.answer.map(async(answer) => {
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
            answer = await Promise.all(question.answer.map(async(answer) => {
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