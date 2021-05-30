const mongoose = require("mongoose");
const schemaTitle = require("../constants/SchemaTitle");
const { FacultyValidate } = require("../constants/ValidationMessage");

const Schema = mongoose.Schema({
    name: {
        type: String,
        required: [true, FacultyValidate.NAME]
    },
    code: {
        type: [Number, FacultyValidate.TYPE_CODE],
        required: [true, FacultyValidate.CODE]
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model(schemaTitle.FACULTY, Schema);