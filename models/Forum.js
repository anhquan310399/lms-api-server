const mongoose = require("mongoose");

const topicSchema = require("./Topic")

const forum = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Title of forum is required']
    },
    description: String,
    topics: [topicSchema],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });


module.exports = forum