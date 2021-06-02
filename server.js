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
require("./models/Semester");
require("./models/Faculty");
require("./models/curriculum/Subject");
require("./models/curriculum/Curriculum");
require("./models/curriculum/Class");
require("./models/course/Course");

const app = require("./app");

const server = app.listen(process.env.PORT || '8000', () => {
    console.log(`Server listening on port ${process.env.PORT || '8000'}`);
});

const io = require("socket.io")(server, { cors: { origin: '*' } });
const jwt = require("jsonwebtoken");

const schemaTitle = require("./constants/SchemaTitle");

const Message = mongoose.model(schemaTitle.MESSAGES);
const User = mongoose.model(schemaTitle.USER);
const { getDetailMessage, getUserById } = require('./services/DataHelpers');
const { discussThroughSocket, isUserCanJoinRoom } = require('./services/SocketUtil');

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

const users = {};

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
    });

    socket.on("chat", async ({ message, chatroomId }) => {
        if (message.trim().length > 0) {
            const newMessage = new Message({
                idChatroom: chatroomId,
                idUser: socket.idUser,
                message,
                createdAt: new Date()
            });
            const detailMessage = await getDetailMessage(newMessage)
            io.to(chatroomId).emit("chatMessage", detailMessage);
            await newMessage.save();
        }
    });

    socket.on("leave-chat", ({ chatroomId }) => {
        socket.leave(chatroomId);
    });

    socket.on('join-zoom', (zoomId, peerId) => {
        if (!users[zoomId]) { users[zoomId] = [] }

        const zoomUser = users[zoomId].find(value => value.idUser === socket.idUser);

        if (!zoomUser) {
            users[zoomId] = [...users[zoomId], { peerId, idUser: socket.idUser }];
            socket.join(zoomId)
            io.to(socket.id).emit('200');

            console.log("User in zoom", users[zoomId]);

            getUserById(socket.idUser).then(user => {
                console.log("user-connected", user, ", peer id", peerId);

                socket.to(zoomId).emit('user-connected', peerId, user);
            });

            socket.on('get-user', (peerId) => {

                console.log("get-user: ", peerId, ", user get: ", socket.idUser, "socket: ", socket.id);

                const user = users[zoomId].find((user) => user.peerId === peerId);
                if (user) {
                    getUserById(user.idUser).then(user => {
                        io.to(socket.id).emit('receive-user', user);
                    });
                } else {
                    console.log("get-user: ", peerId, ", not found user");
                }
            })

            socket.on('message', async (message) => {
                message = {
                    idUser: socket.idUser,
                    message,
                    createdAt: new Date()
                }
                const newMessage = await getDetailMessage(message);
                io.to(zoomId).emit('newMessage', newMessage)
            })
            socket.on('leave', () => {
                //console.log("A user left zoom: " + peerId);
                socket.to(zoomId).emit('user-disconnected', peerId);
                socket.leave(zoomId);
                users[zoomId] = users[zoomId].filter(({ idUser }) => idUser !== socket.idUser);

            })
            socket.on('disconnect', () => {
                //console.log("A user disconnect zoom: " + peerId);
                io.to(zoomId).emit('user-disconnected', peerId);
                socket.leave(zoomId);
                users[zoomId] = users[zoomId].filter(({ idUser }) => idUser !== socket.idUser);
            })
        } else {
            io.to(socket.id).emit('403', 'You has already join room in another application!');
        }
    })


    socket.on('join-topic', ({ idSubject, idTimeline, idForum, idTopic }) => {
        isUserCanJoinRoom(idSubject, socket.idUser)
            .then(isJoinable => {
                if (isJoinable) {
                    socket.join(idTopic);
                }
                else {
                    io.to(socket.id).emit('not-accessible', "You can't join this topic");
                }
            });

        socket.on('discuss', (message) => {
            io.to(socket.id).emit('discuss-success');
            if (message.trim().length > 0) {
                discussThroughSocket(idSubject, idTimeline, idForum, idTopic, message, socket.idUser)
                    .then(res => {
                        if (res.success) {
                            io.to(idTopic).emit("newDiscuss", res.discussion);
                        } else {
                            io.to(socket.id).emit('error', res.message);
                        }
                    });
            }
        });

    })
});