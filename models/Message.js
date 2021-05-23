const mongoose = require("mongoose");
const schemaTitle = require("../constants/SchemaTitle");
const { MessageValidate } = require("../constants/ValidationMessage");

const message = new mongoose.Schema({
    idChatroom: {
        type: mongoose.Schema.Types.ObjectId,
        required: MessageValidate.ID_CHATROOM,
        ref: schemaTitle.CHATROOM,
    },
    idUser: {
        type: mongoose.Schema.Types.ObjectId,
        required: MessageValidate.ID_USER,
        ref: schemaTitle.USER,
    },
    message: {
        type: String,
        required: MessageValidate.MESSAGE,
    },
}, {
    timestamps: true
});

module.exports = mongoose.model(schemaTitle.MESSAGES, message);