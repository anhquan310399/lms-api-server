'use-strict';

require("dotenv").config();

const mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
});

mongoose.connection.on("error", (err) => {
    console.log("Mongoose Connection ERROR: " + err.message);
});

mongoose.connection.once("open", () => {
    console.log("MongoDB Connected!");
});

//Bring in the models
require("./models/Privilege");
require("./models/User");
require("./models/ChatRoom");
require("./models/Message");
require("./models/Course");
require("./models/Subject");

const app = require("./app");

const server = app.listen(process.env.PORT || '8000', () => {
    console.log(`Server listening on port ${process.env.PORT || '8000'}`);
});

const io = require("socket.io")(server, { cors: { origin: '*' } });
const jwt = require("jsonwebtoken");

const Message = mongoose.model("Message");
const User = mongoose.model("User");
const { getDetailMessage } = require('./services/DataMapper');

io.use((socket, next) => {
    try {
        const token = socket.handshake.query.token;
        const payload = jwt.verify(token, process.env.JWT_KEY);
        socket.idUser = payload._id;
        next();
    } catch (err) {
        console.log(err);
    }
});

const countOnlineUser = async () => {
    const user = (await User.find({})).length;
    const online = io.engine.clientsCount;
    io.to("admin").emit("countUsers", {
        online,
        percent: (online * 100 / user).toFixed(0)
    });
}

io.on("connection", (socket) => {
    countOnlineUser();

    socket.on("disconnect", () => {
        countOnlineUser();
    });

    socket.on("join-admin", (() => {
        socket.join("admin");
        countOnlineUser();
    }));

    socket.on("join-chat", ({ chatroomId }) => {
        socket.join(chatroomId);
        console.log("A user joined chatroom: " + chatroomId);

        socket.on("leave", () => {
            socket.leave(chatroomId);
            console.log("A user left chatroom: " + chatroomId);
        });

        socket.on("message", async ({ message }) => {
            if (message.trim().length > 0) {
                const newMessage = new Message({
                    idChatroom: chatroomId,
                    idUser: socket.idUser,
                    message,
                    createdAt: new Date()
                });
                io.to(chatroomId).emit("newMessage", await getDetailMessage(newMessage));
                await newMessage.save();
            }
        });
        socket.on("disconnect", () => {
            socket.leave(chatroomId);
            console.log("A user left chatroom: " + chatroomId);
        });
    });

    socket.on('join-zoom', (zoomId, peerId) => {
        socket.join(zoomId)
        socket.to(zoomId).emit('user-connected', peerId)

        socket.on('message', async (message) => {
            message = {
                idUser: socket.idUser,
                message
            }
            io.to(zoomId).emit('createMessage', await getDetailMessage(message))
        })
        socket.on('leave', () => {
            console.log("A user left zoom: " + peerId);
            socket.to(zoomId).emit('user-disconnected', peerId);
            socket.leave(zoomId);
        })
        socket.on('disconnect', () => {
            console.log("A user left zoom: " + peerId);
            io.to(zoomId).emit('user-disconnected', peerId);
            socket.leave(zoomId);
        })
    })
});