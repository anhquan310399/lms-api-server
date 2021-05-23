const mongoose = require("mongoose");
const timelineSchema = require("./Timeline");
const quizBank = require('./QuizBank');
const surveyBank = require('./SurveyBank');
const schemaTitle = require("../../constants/SchemaTitle");
const User = mongoose.model(schemaTitle.USER);
const Semester = mongoose.model(schemaTitle.SEMESTER);
var ValidatorError = mongoose.Error.ValidatorError;
const STATUS = require('../../constants/AccountStatus');
const PRIVILEGES = require('../../constants/PrivilegeCode');
const { CourseValidate } = require("../../constants/ValidationMessage");

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
        required: [true, CourseValidate.ROLE],
        enum: {
            values: ['public', 'private'],
            message: CourseValidate.ROLE_ENUM
        }
    },
    acceptEnroll: {
        type: Boolean,
        default: false
    }
}, { _id: false })

const Schema = mongoose.Schema({
    name: {
        type: String,
        required: [true, CourseValidate.NAME]
    },
    idSemester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: schemaTitle.SEMESTER,
        required: [true, CourseValidate.ID_SEMESTER],
        validate: function (id) {
            Semester.findById(id)
                .then(course => {
                    if (!course) {
                        throw new ValidatorError({
                            message: CourseValidate.NOT_FOUND_SEMESTER(id),
                            type: 'validate',
                            path: 'idSemester'
                        })
                    }
                });
        }
    },
    config: {
        type: config,
        required: [true, CourseValidate.CONFIG]
    },
    idTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: schemaTitle.USER,
        required: [true, CourseValidate.ID_TEACHER],
        validate: function (id) {
            User.findOne({
                _id: id,
                idPrivilege: PRIVILEGES.TEACHER,
                status: STATUS.ACTIVATED
            })
                .then(teacher => {
                    if (!teacher) {
                        throw new ValidatorError({
                            message: CourseValidate.NOT_FOUND_TEACHER(id),
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
        ref: schemaTitle.USER,
        default: [],
        validate: async function (list) {
            await Promise.all(list.map(async (idStudent) => {
                const student = await User.findOne({
                    _id: idStudent,
                    idPrivilege: PRIVILEGES.STUDENT || PRIVILEGES.REGISTER,
                    status: STATUS.ACTIVATED
                });
                if (!student) {
                    throw new ValidatorError({
                        message: CourseValidate.NOT_FOUND_STUDENT(idStudent),
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
        ref: schemaTitle.USER,
        default: []
    },
    exitRequests: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: schemaTitle.USER,
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

module.exports = mongoose.model(schemaTitle.COURSE, Schema);