const mongoose = require("mongoose");

const commentSchema = require("./Comment");

const { TopicValidate } = require("../../constants/ValidationMessage");

const schemaTitle = require("../../constants/SchemaTitle");

const topicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, TopicValidate.NAME]
    },
    content: {
        type: String,
        required: [true, TopicValidate.CONTENT]
    },
    discussions: [commentSchema],
    idUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: schemaTitle.USER,
        required: true
    }
}, { timestamps: true });


module.exports = topicSchema