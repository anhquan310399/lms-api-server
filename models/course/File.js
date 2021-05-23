const mongoose = require("mongoose");

const { FileValidate } = require("../../constants/ValidationMessage");

const file = new mongoose.Schema({
    name: {
        type: String,
        required: [true, FileValidate.NAME]
    },
    type: {
        type: String,
        required: [true, FileValidate.TYPE]
    },
    path: {
        type: String,
        required: [true, FileValidate.PATH]
    },
    uploadDay: {
        type: Date,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
});


module.exports = file