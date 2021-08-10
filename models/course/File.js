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
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
});

file.pre('save', async function (next) {
    const currentFile = this;
    if (currentFile.isNew || currentFile.isModified('path')) {
        currentFile.uploadDay = new Date();
    }
    next();
})


module.exports = file