const mongoose = require("mongoose");
const questionSchema = require('./Question');
const { QuestionnaireValidate } = require("../../../constants/ValidationMessage");

const questionnaire = new mongoose.Schema({
    name: {
        type: String,
        required: [true, QuestionnaireValidate.NAME]
    },
    questions: {
        type: [questionSchema],
        required: [true, QuestionnaireValidate.QUESTIONS]
    }
});

module.exports = questionnaire;