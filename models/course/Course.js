const mongoose = require("mongoose");
const timelineSchema = require("./Timeline");
const questionnaire = require('./exam/QuizQuestionnaire');
const schemaTitle = require("../../constants/SchemaTitle");
const User = mongoose.model(schemaTitle.USER);
const Semester = mongoose.model(schemaTitle.SEMESTER);
const Subject = mongoose.model(schemaTitle.SUBJECT);
var ValidatorError = mongoose.Error.ValidatorError;
const STATUS = require('../../constants/AccountStatus');
const PRIVILEGES = require('../../constants/PrivilegeCode');
const { CourseValidate } = require("../../constants/ValidationMessage");

const ratioSchema = new mongoose.Schema({
    idField: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    ratio: {
        type: Number,
        default: 0
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
    config: {
        type: config,
        required: [true, CourseValidate.CONFIG]
    },
    idSemester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: schemaTitle.SEMESTER,
        required: [function () {
            return this.config.role === 'private'
        }, CourseValidate.ID_SEMESTER],
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
    idSubject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: schemaTitle.SUBJECT,
        required: [true, CourseValidate.ID_SUBJECT],
        validate: function (id) {
            Subject.findById(id)
                .then(subject => {
                    if (!subject) {
                        throw new ValidatorError({
                            message: CourseValidate.NOT_FOUND_SUBJECT(id),
                            type: 'validate',
                            path: 'idSubject'
                        })
                    }
                });
        }
    },
    code: {
        type: String,
        required: true
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
                            path: 'idTeacher'
                        })
                    }
                });
        }

    },
    quizBank: {
        type: [questionnaire],
        default: []
    },
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
                    $or: [{ status: STATUS.ACTIVATED }, { status: STATUS.NOT_ACTIVATED }]
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