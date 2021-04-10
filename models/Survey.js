const mongoose = require("mongoose");
var ValidatorError = mongoose.Error.ValidatorError;

const answerSheet = new mongoose.Schema({
    idQuestion: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    answer: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Please fill answer']
    }
})

const response = new mongoose.Schema({
    idStudent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answerSheet: {
        type: [answerSheet],
        required: [true, 'Please fill all answer']
    },
    timeResponse: {
        type: Date,
        required: true
    }
})

const survey = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name of survey is required!']
    },
    description: String,
    code: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Code of questionnaire is required']
    },
    responses: {
        type: [response],
    },
    expireTime: {
        type: Date,
        required: [true, 'Expire time of survey is required']
    },
    isDeleted: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });


response.pre('save', async function(next) {
    const currentRely = this;
    const survey = currentRely.parent();
    const answerSheet = currentRely.answerSheet;
    const questionnaire = survey.parent().parent().surveyBank.find(value => {
        return value._id.equals(survey.code);
    }).questions;
    console.log(questionnaire);
    if (answerSheet.length !== questionnaire.length) {
        let err = new ValidatorError({
            message: 'PLease fill all answer of questionnaire'
        });
        return next(err);
    }
    answerSheet.forEach(answerSheet => {
        let question = questionnaire.find(value => value._id.equals(answerSheet.idQuestion));
        if (!question) {
            let err = new ValidatorError({
                message: `Can not found question ${answerSheet.idQuestion} in questionnaire`
            });
            return next(err);
        }
        if (question.typeQuestion === 'choice') {
            let answer = question.answer.find(value => value._id.equals(answerSheet.answer));
            if (!answer) {
                let err = new ValidatorError({
                    message: `Can not found answer ${answerSheet.answer} in question ${question.question}`
                });
                return next(err);
            }
        } else if (question.typeQuestion === 'multiple') {
            answerSheet.answer.forEach(currentAnswer => {
                let answer = question.answer.find(value => value._id.equals(currentAnswer));
                if (!answer) {
                    let err = new ValidatorError({
                        message: `Can not found answer ${currentAnswer} in question ${question.question}`
                    });
                    return next(err);
                }
            });
        }

    });

    next();
});

survey.pre('save', async function(next) {
    const currentSurvey = this;
    const timeline = currentSurvey.parent();
    const subject = timeline.parent();

    const questionnaire = subject.surveyBank.find(value => value._id.equals(currentSurvey.code));

    if (!questionnaire) {
        const err = new ValidatorError({ message: `Can't not found questionnaire for ${currentSurvey.name} in database!. Please import surveyBank has questionnaire with _id: ${currentSurvey.code} before` });
        return next(err);
    }

    next();
})



module.exports = survey;