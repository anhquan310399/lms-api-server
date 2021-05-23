const mongoose = require("mongoose");
const file = require('./File');
const comment = require('./Comment');

const { AssignmentValidate } = require("../../constants/ValidationMessage");
const schemaTitle = require("../../constants/SchemaTitle");

const feedBack = new mongoose.Schema({
    grade: {
        type: Number,
        required: [true, AssignmentValidate.GRADE],
        min: [0, AssignmentValidate.GRADE_MIN],
        max: [10, AssignmentValidate.GRADE_MAX]
    },
    gradeOn: {
        type: Date,
        required: true
    },
    gradeBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: schemaTitle.USER,
        required: true
    },
    comments: {
        type: [comment],
        default: []
    }
}, { _id: false });

const submission = new mongoose.Schema({
    idStudent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: schemaTitle.USER,
        required: true
    },
    file: {
        type: file,
        required: [true, AssignmentValidate.SUBMISSION_FILE],
    },
    submitTime: {
        type: Date,
        required: true
    },
    feedBack: feedBack
});

const setting = new mongoose.Schema({
    startTime: {
        type: Date,
        required: [true, AssignmentValidate.SETTING_START_TIME]
    },
    expireTime: {
        type: Date,
        required: [true, AssignmentValidate.SETTING_EXPIRE_TIME],
        validate: [function (value) {
            return value >= this.startTime
        }, AssignmentValidate.SETTING_EXPIRE_TIME_VALID]
    },
    isOverDue: {
        type: Boolean,
        default: false
    },
    overDueDate: {
        type: Date,
        required: [function () {
            return this.isOverDue;
        }, AssignmentValidate.SETTING_OVERDUE_DATE],
        validate: [function (value) {
            if (this.isOverDue) {
                return value > this.expireTime
            } else {
                return true
            }
        }, AssignmentValidate.SETTING_OVERDUE_DATE_VALID]
    },
    fileSize: {
        type: Number,
        min: [5, AssignmentValidate.SETTING_FILE_SIZE_MIN],
        max: [500, AssignmentValidate.SETTING_FILE_SIZE_MAX],
        default: 5
    }

}, { _id: false });

const assignmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, AssignmentValidate.NAME]
    },
    content: {
        type: String,
        required: [true, AssignmentValidate.CONTENT]
    },
    attachments: {
        type: [file]
    },
    setting: {
        type: setting,
        required: [true, AssignmentValidate.SETTING]
    },
    submissions: [submission],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });


assignmentSchema.pre('save', async function (next) {
    let currentAssignment = this;
    if (currentAssignment.isNew) {
        let timeline = currentAssignment.parent();
        let subject = timeline.parent();
        if (!subject.transcript) {
            subject.transcript = [];
        }
        subject.transcript = subject.transcript.concat({ idField: currentAssignment._id });
    }
});

module.exports = assignmentSchema