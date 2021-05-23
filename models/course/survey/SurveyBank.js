const mongoose = require("mongoose");

const surveyBank = new mongoose.Schema({
    questions: {
        type: [question],
        default: []
    }
});

surveyBank.pre('save', async function (next) {
    let curBank = this;
    if (curBank.isNew || curBank.isModified('questions')) {
        let questions = curBank.questions;
        questions = await Promise.all(questions.map(async (question) => {
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