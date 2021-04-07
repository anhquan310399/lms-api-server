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

const surveyBank = new mongoose.Schema({
    name: {
        type: String,
        require: [true, 'Name of questionnaire is required']
    },
    questions: {
        type: [question],
        required: [true, 'Question of questionnaire is required']
    }
});

surveyBank.pre('save', async function(next) {
    let curBank = this;
    if (curBank.isNew || curBank.isModified('questions')) {
        let questions = curBank.questions;
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
        curBank.questions = questions;
    }
    next();
});


module.exports = surveyBank;