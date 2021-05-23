const mongoose = require("mongoose");

const { CommentValidate } = require("../../constants/ValidationMessage");
const schemaTitle = require("../../constants/SchemaTitle");


const discussionSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, CommentValidate.CONTENT]
    },
    idUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: schemaTitle.USER,
        required: true
    }
}, { timestamps: true })

module.exports = discussionSchema