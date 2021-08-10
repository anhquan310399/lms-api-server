const mongoose = require("mongoose");
const schemaTitle = require("../constants/SchemaTitle");
const { SemesterValidate } = require("../constants/ValidationMessage");

const Schema = mongoose.Schema({
    name: {
        type: String,
        required: [true, SemesterValidate.NAME]
    },
    isCurrent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model(schemaTitle.SEMESTER, Schema);