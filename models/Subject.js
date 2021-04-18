const mongoose = require("mongoose");
const timelineSchema = require("./Timeline");
const quizBank = require('./QuizBank');
const surveyBank = require('./SurveyBank');
const User = mongoose.model('User');
const Course = mongoose.model('Course');
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

const config = new mongoose.Schema({
    role: {
        type: String,
        required: [true, 'Role of subject is required'],
        enum: {
            values: ['public', 'private'],
            message: 'Role of subject is only public and private'
        }
    },
    acceptEnroll: {
        type: Boolean,
        default: false
    }
})

const Schema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name of subject is required']
    },
    idCourse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Id course is required'],
        validate: function(value) {
            Course.findById(value)
                .then(course => {
                    if (!course) {
                        throw new ValidatorError({
                            message: 'Not found course',
                            type: 'validate',
                            path: 'idCourse'
                        })
                    }
                });
        }
    },
    config: {
        type: config,
        required: [true, 'Config of subject is required']
    },
    idLecture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Id lecture is required'],
        validate: function(value) {
            User.findOne({ _id: value, idPrivilege: 'teacher' })
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
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: [],
        validate: async function(list) {
            await Promise.all(list.map(async(idStudent) => {
                const student = await User.findOne({
                    isDeleted: false,
                    idPrivilege: 'student',
                    _id: idStudent
                });
                if (!student) {
                    throw new ValidatorError({
                        message: `Not found student with id: ${idStudent}`,
                        type: 'validate',
                        path: 'studentIds'
                    })
                }
                return idStudent;
            }));
        }
    },
    enrollRequests: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
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

module.exports = mongoose.model("Subject", Schema);