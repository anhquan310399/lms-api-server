const mongoose = require("mongoose");

const message = new mongoose.Schema({
    idChatroom: {
        type: mongoose.Schema.Types.ObjectId,
        required: "idChatroom is required!",
        ref: "Chatroom",
    },
    idUser: {
        type: mongoose.Schema.Types.ObjectId,
        required: "idUser is required!",
        ref: "User",
    },
    message: {
        type: String,
        required: "Message is required!",
    },
}, {
    timestamps: true
});

module.exports = mongoose.model("Message", message);