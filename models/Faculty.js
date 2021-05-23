const mongoose = require("mongoose");
const schemaTitle = require("../constants/SchemaTitle");
const { FacultyValidate } = require("../constants/ValidationMessage");
const Curriculum = mongoose.model(schemaTitle.CURRICULUM);
var ValidatorError = mongoose.Error.ValidatorError;

const Schema = mongoose.Schema({
    name: {
        type: String,
        required: [true, FacultyValidate.NAME]
    },
    code: {
        type: [Number, FacultyValidate.TYPE_CODE],
        required: [true, FacultyValidate.CODE]
    },
    curriculums: {
        type: [mongoose.Types.ObjectId],
        default: [],
        ref: schemaTitle.CURRICULUM,
        validate: async function (list) {
            await Promise.all(list.map(async (id) => {
                const temp = await Curriculum.findById(id);
                if (!temp) {
                    throw new ValidatorError({
                        message: FacultyValidate.NOT_FOUND_CURRICULUM(id),
                        type: 'validate',
                        path: 'faculty.curriculums'
                    })
                }
                return id;
            }));
        }
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model(schemaTitle.FACULTY, Schema);