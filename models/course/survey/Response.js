const mongoose = require("mongoose");
var ValidatorError = mongoose.Error.ValidatorError;
const schemaTitle = require("../../../constants/SchemaTitle");
const { SurveyResponseValidate } = require("../../../constants/ValidationMessage");


const answer = new mongoose.Schema({
    idQuestion: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    answer: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    }
})

const response = new mongoose.Schema({
    idStudent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: schemaTitle.USER,
        required: true
    },
    answerSheet: {
        type: [answer],
        required: true,
    },
    timeResponse: {
        type: Date,
        required: true
    }
});

response.pre('save', async function (next) {
    const curResponse = this;
    const survey = curResponse.parent();
    const answerSheet = curResponse.answerSheet;
    if (survey.isModified("responses")) {
        const questionnaire = survey.questionnaire;

        if (answerSheet.length !== questionnaire.length) {
            const err = new ValidatorError({
                message: SurveyResponseValidate.INCOMPLETE
            });
            return next(err);
        }
        answerSheet.forEach(answer => {
            const question = questionnaire.find(value => value._id.equals(answer.idQuestion));
            if (!question) {
                const err = new ValidatorError({
                    message: SurveyResponseValidate.NOT_FOUND_QUESTION(answer.idQuestion)
                });
                return next(err);
            }
            if (question.typeQuestion === 'choice') {
                const choice = question.answer.find(value => value._id.equals(answer.answer));
                if (!choice) {
                    const err = new ValidatorError({
                        message: SurveyResponseValidate.NOT_FOUND_ANSWER(answer.answer, question.content)
                    });
                    return next(err);
                }
            } else if (question.typeQuestion === 'multiple') {
                answer.answer.forEach(currentAnswer => {
                    const choice = question.answer.find(value => value._id.equals(currentAnswer));
                    if (!choice) {
                        const err = new ValidatorError({
                            message: SurveyResponseValidate.NOT_FOUND_ANSWER(currentAnswer, question.content)
                        });
                        return next(err);
                    }
                });
            }
        });
    }
    next();
});

module.exports = response;