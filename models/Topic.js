const mongoose = require("mongoose");

const commentSchema = require("./Comment");

const topicSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title of Topic is required"]
    },
    content: {
        type: String,
        required: [true, "Content of Topic is required"]
    },
    discussions: [commentSchema],
    idUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });


module.exports = topicSchema