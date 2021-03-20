const mongoose = require("mongoose");

const discussionSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Content of comment is required!']
    },
    idUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true })

module.exports = discussionSchema