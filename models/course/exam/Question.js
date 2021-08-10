const mongoose = require("mongoose");
const { QuestionValidate } = require("../../../constants/ValidationMessage");

const questionOption = new mongoose.Schema({
    answer: {
        type: String,
        required: [true, QuestionValidate.ANSWER_CONTENT]
    },
    isCorrect: {
        type: Boolean,
        default: false
    }
})

const question = new mongoose.Schema({
    question: {
        type: String,
        required: [true, QuestionValidate.CONTENT]
    },
    answers: {
        type: [questionOption],
        required: [true, QuestionValidate.ANSWER]
    },
    typeQuestion: {
        type: String,
        required: [true, QuestionValidate.TYPE],
        enum: ['choice', 'multiple']
    },
    explain: String
});

module.exports = question;
