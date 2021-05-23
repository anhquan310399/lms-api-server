const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const { CurriculumValidate } = require("../../constants/ValidationMessage");
const Subject = mongoose.model(schemaTitle.SUBJECT);
const Class = mongoose.model(schemaTitle.CLASS);
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
    },
    classes: {
        type: [mongoose.Types.ObjectId],
        default: [],
        ref: schemaTitle.CLASS,
        validate: async function (list) {
            await Promise.all(list.map(async (id) => {
                const temp = await Class.findById(id);
                if (!temp) {
                    throw new ValidatorError({
                        message: CurriculumValidate.NOT_FOUND_CLASS(id),
                        type: 'validate',
                        path: 'curriculum.classes'
                    })
                }
                return id;
            }));
        }
    },
}, {
    timestamps: true
});

module.exports = mongoose.model(schemaTitle.CURRICULUM, Schema);