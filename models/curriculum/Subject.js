const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const { SubjectValidate } = require("../../constants/ValidationMessage");

const Schema = mongoose.Schema({
    name: {
        type: String,
        required: [true, SubjectValidate.NAME]
    },
    code: {
        unique: true,
        type: String,
        required: [true, SubjectValidate.CODE]
    },
    credit: {
        required: [true, SubjectValidate.CREDIT],
        type: [Number, SubjectValidate.TYPE_CREDIT],
        min: [1, SubjectValidate.MIN_CREDIT],
        default: 1
    }
}, {
    timestamps: true
});

module.exports = mongoose.model(schemaTitle.SUBJECT, Schema);