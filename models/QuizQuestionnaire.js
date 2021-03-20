const mongoose = require("mongoose");

const questionOption = new mongoose.Schema({
    answer: {
        type: String,
        required: [true, 'Content of answer is required']
    },
    isCorrect: {
        type: Boolean,
        default: false
    }
})

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Content of question is required']
    },
    answers: {
        type: [questionOption],
        required: [true, 'Answers of question is required']
    },
    typeQuestion: {
        type: String,
        required: [true, 'Type of question is required'],
        enum: ['choice', 'multiple']
    },
    explain: String
})

const quizQuestionnaire = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name of chapter is required']
    },
    questions: [questionSchema]
});

module.exports = quizQuestionnaire;