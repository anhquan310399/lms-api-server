const mongoose = require("mongoose");
const schemaTitle = require("../../../constants/SchemaTitle");
const { findChapterOfQuizBank } = require('../../../services/FindHelpers');

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
        ref: schemaTitle.USER,
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

    const testFlag= false;
    
    if ((!answerSheet.isNew && answerSheet.isModified('answers')) || testFlag) {

        const exam = answerSheet.parent();

        // exam -> timeline -> course
        const course = exam.parent().parent();

        let totalQuestion = 0;

        const questions = exam.setting.questionnaires.reduce((result, current) => {

            totalQuestion += current.questionCount;

            const chapter = findChapterOfQuizBank(course, current.id);

            result = result.concat(chapter.questions);

            return result;
        }, []);

        const correct = await answerSheet.answers.reduce(async (result, currentAnswer) => {

            const question = questions.find(function (question) {
                return (question._id.equals(currentAnswer.idQuestion));
            });

            let grade = 0;

            if (question.typeQuestion === 'choice') {

                const correctAnswer = question.answers.find(answer => {
                    return answer.isCorrect;
                });

                if (correctAnswer._id.equals(currentAnswer.idAnswer)) {
                    grade++;
                }

            } else if (question.typeQuestion === 'multiple') {

                const correctAnswers = question.answers.filter(answer => {
                    return answer.isCorrect;
                });

                if (currentAnswer.idAnswer.length <= correctAnswers.length) {

                    correctAnswers.forEach(answer => {
                        currentAnswer.idAnswer.forEach(element => {
                            if (answer._id.equals(element)) {
                                grade++;
                                return;
                            }
                        });
                    });

                    grade /= correctAnswers.length;
                }
            }
            return (await result) + grade;
        },
            0);

        const factor = 10 / totalQuestion;

        answerSheet.grade = (correct * factor).toFixed(2);
    }
    next();
})

module.exports = studentAnswerSheet