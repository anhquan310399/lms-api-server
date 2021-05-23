const mongoose = require("mongoose");
const { AnnouncementValidate } = require("../../constants/ValidationMessage");

const announcement = new mongoose.Schema({
    name: {
        type: String,
        required: [true, AnnouncementValidate.NAME]
    },
    content: {
        type: String,
        required: [true, AnnouncementValidate.CONTENT]
    }
}, { timestamps: true });

module.exports = announcement