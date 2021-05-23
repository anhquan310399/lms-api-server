const mongoose = require("mongoose");
const { QuestionValidate } = require("../../../constants/ValidationMessage");

const question = new mongoose.Schema({
    content: {
        type: String,
        required: [true, QuestionValidate.CONTENT]
    },
    typeQuestion: {
        type: String,
        required: [true, QuestionValidate.TYPE],
        enum: ['choice', 'multiple', 'fill']
    },
    answer: {
        type: mongoose.Schema.Types.Mixed,
        required: [
            function () {
                return (this.typeQuestion === 'choice' || this.typeQuestion === 'multiple')
            }, QuestionValidate.ANSWER
        ]
    }
});

module.exports = question;
