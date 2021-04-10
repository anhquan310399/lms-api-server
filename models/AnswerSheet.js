const mongoose = require("mongoose");

const studentAnswer = new mongoose.Schema({
    idQuestion: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    idAnswer: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
}, { _id: false })

const studentAnswerSheet = new mongoose.Schema({
    idStudent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answers: {
        type: [studentAnswer],
        required: true
    },
    grade: {
        type: Number,
        default: 0
    },
    isSubmitted: {
        type: Boolean,
        default: false
    },
    startTime: {
        type: Date,
        required: true
    }
});

studentAnswerSheet.pre('save', async function (next) {
    const answerSheet = this;
    if (!answerSheet.isNew && answerSheet.isModified('answers')) {
        const exam = answerSheet.parent();
        const quizBank = answerSheet.parent().parent().parent().quizBank
            .find(value => {
                return value._id.equals(exam.setting.code);
            });
        let amount = await answerSheet.answers.reduce(async function (res, current) {
            let question = await quizBank.questions.find(function (value) {
                return (value._id.equals(current.idQuestion));
            });
            let grade = 0;

            if (question.typeQuestion === 'choice') {
                let correctAnswer = question.answers.find(answer => {
                    return answer.isCorrect;
                });
                if (correctAnswer._id.equals(current.idAnswer)) {
                    grade++;
                }
            } else if (question.typeQuestion === 'multiple') {
                let correctAnswers = question.answers.filter(answer => {
                    return answer.isCorrect;
                });
                if (current.idAnswer.length <= correctAnswers.length) {
                    correctAnswers.forEach(answer => {
                        current.idAnswer.forEach(element => {
                            if (answer._id.equals(element)) {
                                grade++;
                                return;
                            }
                        });
                    });
                    grade /= correctAnswers.length;
                }
            }
            return (await res) + grade;
        },
            0);

        let factor = 10 / exam.setting.questionCount;

        answerSheet.grade = (amount * factor).toFixed(2);
    }
    next();
})

module.exports = studentAnswerSheet