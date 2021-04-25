const mongoose = require("mongoose");
const Chatroom = mongoose.model("Chatroom");
const User = mongoose.model("User");
const Message = mongoose.model("Message");
const { HttpUnauthorized } = require('../../utils/errors');
const _ = require('lodash');
const { getDetailMessage } = require('../../services/DataMapper');
exports.createChatroom = async (req, res) => {
    const { to } = req.body;
    const rooms = await Chatroom.find({ 'users.idUser': req.user._id });
    const currentUsers = [to, req.user._id.toString()];
    const chatroomExists = rooms.find(room => {
        const users = room.users.map(user => {
            return user.idUser.toString();
        });
        if (users.length === currentUsers.length &&
            currentUsers.every(number => users.indexOf(number) >= 0)) {
            return true;
        } else {
            return false;
        }
    });
    if (chatroomExists) {
        throw new HttpUnauthorized("Chatroom with that user already exists!")
    }
    const room = new Chatroom({
        users: [{
            idUser: req.user._id
        }, {
            idUser: to
        }]
    })
    await room.save();
    res.json({
        message: "Chatroom created!",
        idChatroom: room._id
    });
};

exports.getAllChatrooms = async (req, res) => {
    const chatrooms = await Chatroom.find({ 'users.idUser': req.user._id });
    const rooms = await Promise.all(chatrooms.map(async (room) => {
        const to = room.users.find(user => !user.idUser.equals(req.user._id));
        const user = await User.findById(to.idUser);
        const message = (await Message.find({ idChatroom: room._id }).sort({ createdAt: -1 }))[0];
        return {
            _id: room._id,
            name: user.firstName + " " + user.lastName,
            image: user.urlAvatar,
            message: message ? message.message : ""
        }
    }))
    res.json({
        rooms
    });
};

exports.getChatroom = async (req, res) => {
    const chatroom = await Chatroom.findById(req.params.idChatroom);
    let messages = _.reverse(await Message.find({ idChatroom: chatroom._id })
        .sort({ createdAt: -1 }).limit(20));
    messages = await Promise.all(messages.map(async message => {
        return getDetailMessage(message);
    }));
    const to = chatroom.users.find(user => !user.idUser.equals(req.user._id));
    const user = await User.findById(to.idUser);

    res.json({
        room: {
            _id: chatroom._id,
            name: user.firstName + " " + user.lastName,
            image: user.urlAvatar,
            messages
        }
    });
}