const mongoose = require("mongoose");

const question = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Content of question is required']
    },
    typeQuestion: {
        type: String,
        required: [true, 'Type of question is required'],
        enum: ['choice', 'multiple', 'fill']
    },
    answer: {
        type: mongoose.Schema.Types.Mixed,
        required: [
            function() {
                return (this.typeQuestion === 'choice' || this.typeQuestion === 'multiple')
            }, 'Answer of question is required'
        ]
    }
});

const questionnaire = new mongoose.Schema({
    name: {
        type: String,
        require: [true, 'Name of questionnaire is required']
    },
    questions: {
        type: [question],
        required: [true, 'Question of Questionnaire is required']
    }
});

questionnaire.pre('save', async function(next) {
    let currentQuestionnaire = this;
    // If you call `next()` with an argument, that argument is assumed to be
    // an error.
    if (currentQuestionnaire.isNew || currentQuestionnaire.isModified('questions')) {
        let questions = currentQuestionnaire.questions;
        questions = await Promise.all(questions.map(async(question) => {
            if (question.typeQuestion === 'choice' || question.typeQuestion === 'multiple') {
                let answer = await question.answer.map(value => {
                    return {
                        _id: new mongoose.Types.ObjectId,
                        content: value
                    }
                })
                return {
                    _id: question._id,
                    question: question.question,
                    typeQuestion: question.typeQuestion,
                    answer: answer
                }
            } else if (question.typeQuestion === 'fill') {
                return {
                    _id: question._id,
                    question: question.question,
                    typeQuestion: question.typeQuestion,
                }
            }
        }));
        currentQuestionnaire.questions = questions;
    }
    next();
});


module.exports = questionnaire;