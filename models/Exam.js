const mongoose = require("mongoose");

const studentAnswerSheetSchema = require("./studentAnswerSheet");
var ValidatorError = mongoose.Error.ValidatorError;

const setting = new mongoose.Schema({
    code: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Code of quiz questionnaire is required"]
    },
    questionCount: {
        type: Number,
        required: [true, "Amount questions of quiz is required"],
        min: [1, "Min of amount questions is 1"]
    },
    timeToDo: {
        type: Number,
        required: [true, "Time of quiz is required"],
        min: [0, "Min of time to do is 0"]
    },
    attemptCount: {
        type: Number,
        required: true,
        default: 1,
        min: [0, "Min of attempt count is 0"],
    },
    startTime: {
        type: Date,
        required: [true, "Start time of exam is required"]
    },
    expireTime: {
        type: Date,
        required: [true, "Expire time of exam is required"],
        validate: [function (value) {
            return value >= this.startTime
        }, "Expire time must be more than start time"]
    },
}, { _id: false });

const exam = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name of exam is required"]
    },
    content: {
        type: String,
        required: [true, "Requirement of exam is required"]
    },
    submissions: [studentAnswerSheetSchema],
    setting: {
        type: setting,
        required: [true, "Setting of exam is required"]
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

exam.pre('save', async function (next) {
    let currentExam = this;
    let timeline = currentExam.parent();
    let subject = timeline.parent();

    let questionnaire = subject.quizBank.find(value => value._id == currentExam.setting.code);

    if (!questionnaire) {
        const err = new ValidatorError({ message: `Can't not found questionnaire for ${currentExam.name} in database!. Please import quizBank has questionnaire with _id: ${currentExam.setting.code} before` });
        return next(err);
    }
    if (currentExam.isNew) {
        console.log("Create new exam!");
        if (!subject.transcript) {
            subject.transcript = [];
        }
        subject.transcript = subject.transcript.concat({ idField: currentExam._id });
    }
    next();
});

module.exports = exam