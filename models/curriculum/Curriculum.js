const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const { CurriculumValidate } = require("../../constants/ValidationMessage");
const Subject = mongoose.model(schemaTitle.SUBJECT);
const Faculty = mongoose.model(schemaTitle.FACULTY);
var ValidatorError = mongoose.Error.ValidatorError;

const Schema = mongoose.Schema({
    name: {
        type: String,
        required: [true, CurriculumValidate.NAME]
    },
    code: {
        type: String,
        required: [true, CurriculumValidate.CODE]
    },
    idFaculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: schemaTitle.FACULTY,
        required: [true, CurriculumValidate.ID_FACULTY],
        validate: function (id) {
            Faculty.findById(id)
                .then(faculty => {
                    if (!faculty) {
                        throw new ValidatorError({
                            message: CurriculumValidate.NOT_FOUND_FACULTY(id),
                            type: 'validate',
                            path: 'Curriculum.idFaculty'
                        })
                    }
                });
        }
    },
    subjects: {
        type: [mongoose.Types.ObjectId],
        default: [],
        ref: schemaTitle.SUBJECT,
        validate: async function (list) {
            await Promise.all(list.map(async (id) => {
                const subject = await Subject.findById(id);
                if (!subject) {
                    throw new ValidatorError({
                        message: CurriculumValidate.NOT_FOUND_SUBJECT(id),
                        type: 'validate',
                        path: 'curriculum.subjects'
                    })
                }
                return id;
            }));
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model(schemaTitle.CURRICULUM, Schema);