const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const { ClassValidate } = require("../../constants/ValidationMessage");
const User = mongoose.model(schemaTitle.USER);
const Curriculum = mongoose.model(schemaTitle.CURRICULUM);
const PRIVILEGES = require('../../constants/PrivilegeCode');
const STATUS = require('../../constants/AccountStatus');
var ValidatorError = mongoose.Error.ValidatorError;

const Schema = mongoose.Schema({
    name: {
        type: String,
        required: [true, ClassValidate.NAME]
    },
    code: {
        type: String,
        required: [true, ClassValidate.CODE]
    },
    idCurriculum: {
        type: mongoose.Schema.Types.ObjectId,
        ref: schemaTitle.FACULTY,
        required: [true, ClassValidate.ID_CURRICULUM],
        validate: function (id) {
            Curriculum.findById(id)
                .then(curriculum => {
                    if (!curriculum) {
                        throw new ValidatorError({
                            message: ClassValidate.NOT_FOUND_CURRICULUM(id),
                            type: 'validate',
                            path: 'Class.idCurriculum'
                        })
                    }
                });
        }
    },
    students: {
        type: [mongoose.Types.ObjectId],
        default: [],
        ref: schemaTitle.SUBJECT,
        validate: async function (list) {
            await Promise.all(list.map(async (idStudent) => {
                const student = await User.findOne({
                    _id: idStudent,
                    idPrivilege: PRIVILEGES.STUDENT,
                    $or: [{ status: STATUS.ACTIVATED }, { status: STATUS.NOT_ACTIVATED }]
                });
                if (!student) {
                    throw new ValidatorError({
                        message: ClassValidate.NOT_FOUND_STUDENT(idStudent),
                        type: 'validate',
                        path: 'class.students'
                    })
                }
                return idStudent;
            }));
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model(schemaTitle.CLASS, Schema);