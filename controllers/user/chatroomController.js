const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const Chatroom = mongoose.model(schemaTitle.CHATROOM);
const User = mongoose.model(schemaTitle.USER);
const Message = mongoose.model(schemaTitle.MESSAGES);
const { HttpUnauthorized, HttpNotFound } = require('../../utils/errors');
const _ = require('lodash');
const { getDetailMessage } = require('../../services/DataHelpers');
const DETAILS = require('../../constants/AccountDetail');
const STATUS = require('../../constants/AccountStatus');
const { ClientResponsesMessages } = require('../../constants/ResponseMessages');
const { ChatResponseMessages } = ClientResponsesMessages

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
        throw new HttpUnauthorized(ChatResponseMessages.ROOM_EXISTED)
    }
    const room = new Chatroom({
        users: [{
            idUser: req.user._id
        }, {
            idUser: to
        }]
    })
    await room.save();
    const user = await User.findById(to);
    res.json({
        message: ChatResponseMessages.CREATE_ROOM_SUCCESS,
        idChatroom: room._id,
        room: {
            _id: room._id,
            name: user.firstName + " " + user.lastName,
            image: user.urlAvatar,
            idUser: user._id
        }
    });
};

exports.getAllChatrooms = async (req, res) => {
    const chatrooms = await Chatroom.find({ 'users.idUser': req.user._id });
    const rooms = await Promise.all(chatrooms.map(async (room) => {
        const to = room.users.find(user => !user.idUser.equals(req.user._id));
        const user = await User.findById(to.idUser);
        // const message = (await Message.find({ idChatroom: room._id }).sort({ createdAt: -1 }))[0];
        return {
            _id: room._id,
            name: user.firstName + " " + user.lastName,
            image: user.urlAvatar,
            idUser: user._id
            // message: message ? message.message : ""
        }
    }))
    res.json({
        rooms
    });
};

exports.getChatroom = async (req, res) => {
    const chatroom = await Chatroom.findById(req.params.idChatroom);
    if (!chatroom) {
        throw new HttpNotFound(ChatResponseMessages.ROOM_NOT_FOUND);
    }
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

exports.getMessages = async (req, res) => {
    const chatroom = await Chatroom.findById(req.params.idChatroom);
    if (!chatroom) {
        throw new HttpNotFound(ChatResponseMessages.ROOM_NOT_FOUND);
    }
    const current = req.body.current;
    let messages = _.reverse(await Message.find({ idChatroom: chatroom._id })
        .sort({ createdAt: -1 }).skip(current).limit(20));
    messages = await Promise.all(messages.map(async message => {
        return getDetailMessage(message);
    }));

    res.json({
        messages
    });
}

exports.searchNewContact = async (req, res) => {
    const chatrooms = await Chatroom.find({ 'users.idUser': req.user._id });
    const userIds = await Promise.all(chatrooms.map(async (room) => {
        const user = room.users.find(user => !user.idUser.equals(req.user._id));
        return user.idUser;
    }));

    const { searchText, current } = req.body;
    const contacts = await User.find({
        code: { $regex: new RegExp("^" + searchText.toLowerCase(), "i") },
        status: STATUS.ACTIVATED,
        _id: { "$nin": userIds }
    },
        DETAILS.COMMON).skip(current).limit(10);

    res.json({
        contacts
    })
}