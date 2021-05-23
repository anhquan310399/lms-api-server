const mongoose = require("mongoose");

const AnswerSheet = require("../AnswerSheet");

const { ExamValidate } = require("../../../constants/ValidationMessage");
const schemaTitle = require("../../../constants/SchemaTitle");

var ValidatorError = mongoose.Error.ValidatorError;

const questionnaire = new mongoose.Schema({
    id: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, ExamValidate.SETTING_QUESTIONNAIRE_ID]
    },
    questionCount: {
        type: Number,
        required: [true, ExamValidate.SETTING_QUESTION_COUNT(this.id)],
        min: [1, ExamValidate.SETTING_QUESTION_COUNT_MIN]
    },
}, { _id: false });

const setting = new mongoose.Schema({
    questionnaires: {
        type: [questionnaire],
        required: [true,],
    },
    timeToDo: {
        type: Number,
        required: [true, ExamValidate.SETTING_TIME_TO_DO],
        min: [15, ExamValidate.SETTING_TIME_TO_DO_MIN]
    },
    attemptCount: {
        type: Number,
        required: [true, ExamValidate.SETTING_ATTEMPT_COUNT],
        default: 1,
        min: [1, ExamValidate.SETTING_ATTEMPT_COUNT_MIN],
    },
    startTime: {
        type: Date,
        required: [true, ExamValidate.SETTING_START_TIME]
    },
    expireTime: {
        type: Date,
        required: [true, ExamValidate.SETTING_EXPIRE_TIME],
        validate: [function (value) {
            return value >= this.startTime
        }, ExamValidate.SETTING_EXPIRE_TIME_VALID]
    },
}, { _id: false });

const exam = new mongoose.Schema({
    name: {
        type: String,
        required: [true, ExamValidate.NAME]
    },
    content: {
        type: String,
        required: [true, ExamValidate.CONTENT]
    },
    submissions: [AnswerSheet],
    setting: {
        type: setting,
        required: [true, ExamValidate.SETTING]
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

exam.pre('save', async function (next) {
    const currentExam = this;
    const timeline = currentExam.parent();
    const subject = timeline.parent();

    currentExam.setting.questionnaires.forEach(element => {
        const questionnaire = subject.quizBank.find(value => value._id.equals(element.id));

        if (!questionnaire) {
            const err = new ValidatorError({ message: ExamValidate.NOT_FOUND_QUESTIONNAIRE(element.id) });
            return next(err);
        }
    });

    if (currentExam.isNew) {
        if (!subject.transcript) {
            subject.transcript = [];
        }
        subject.transcript = subject.transcript.concat({ idField: currentExam._id });
    }
    next();
});

module.exports = exam