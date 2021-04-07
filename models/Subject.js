const mongoose = require("mongoose");
const timelineSchema = require("./Timeline");
const quizBank = require('./QuizBank');
const surveyBank = require('./SurveyBank');
const User = mongoose.model('User');
var ValidatorError = mongoose.Error.ValidatorError;

const ratioSchema = new mongoose.Schema({
    idField: {
        type: String,
        required: true
    },
    ratio: {
        type: Number,
        default: 1
    }
})

const Schema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name of subject is required']
    },
    idLecture: {
        type: String,
        ref: 'User',
        required: [true, 'Id lecture is required'],
        validate: async function (value) {
            await User.findOne({ code: value, idPrivilege: 'teacher' })
                .then(teacher => {
                    if (!teacher) {
                        throw new ValidatorError({
                            message: 'Not found teacher',
                            type: 'validate',
                            path: 'idLecture'
                        })
                    }
                });
        }

    },
    quizBank: [quizBank],
    surveyBank: [surveyBank],
    timelines: [timelineSchema],
    studentIds: {
        type: [String],
        ref: 'User',
        validate: async function (list) {
            await Promise.all(list.map(async (idStudent) => {
                let student = await User.findOne({
                    isDeleted: false,
                    idPrivilege: 'student',
                    code: idStudent
                }).
                    then(data => data);
                if (!student) {
                    throw new ValidatorError({
                        message: `Not found student with code: ${idStudent}`,
                        type: 'validate',
                        path: 'studentIds'
                    })
                }
                return idStudent;
            }));
        }
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    transcript: {
        type: [ratioSchema],
        default: []
    }
}, {
    timestamps: true
});

Schema.pre('save', function (next) {
    var subject = this;
    if (subject.isModified('studentIds')) {
        subject.studentIds = subject.studentIds.sort();
    }
    next();
});

module.exports = mongoose.model("Subject", Schema);