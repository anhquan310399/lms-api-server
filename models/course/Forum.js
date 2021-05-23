const mongoose = require("mongoose");

const topicSchema = require("./Topic");

const { ForumValidate } = require("../../constants/ValidationMessage");

const forum = new mongoose.Schema({
    name: {
        type: String,
        required: [true, ForumValidate.NAME]
    },
    description: String,
    topics: {
        type: [topicSchema],
        default: []
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });


module.exports = forum