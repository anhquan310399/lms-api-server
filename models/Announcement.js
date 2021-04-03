const mongoose = require("mongoose");

const announcement = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Title of announcement is required!']
    },
    content: {
        type: String,
        required: [true, 'Content of announcement is required!']
    }
}, { timestamps: true });

module.exports = announcement