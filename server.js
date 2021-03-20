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
//require("./models/Chatroom");
require("./models/Message");
require("./models/Subject");

const app = require("./app");

const server = app.listen(process.env.PORT || '8000', () => {
  console.log(`Server listening on port ${process.env.PORT || '8000'}`);
});

const io = require("socket.io")(server, { cors: { origin: '*' } });
const jwt = require("jsonwebtoken");

const Message = mongoose.model("Message");
const User = mongoose.model("User");

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.query.token;
    const payload = await jwt.verify(token, process.env.SECRET);
    socket.idUser = payload._id;
    next();
  } catch (err) { }
});

io.on("connection", (socket) => {
  console.log("Connected: " + socket.idUser);

  socket.on("disconnect", () => {
    console.log("Disconnected: " + socket.idUser);
  });

  socket.on("joinRoom", ({ chatroomId }) => {
    socket.join(chatroomId);
    console.log("A user joined chatroom: " + chatroomId);
  });

  socket.on("leaveRoom", ({ chatroomId }) => {
    socket.leave(chatroomId);
    console.log("A user left chatroom: " + chatroomId);
  });

  socket.on("chatroomMessage", async ({ chatroomId, message }) => {
    if (message.trim().length > 0) {
      const user = await User.findOne({ _id: socket.idUser });
      const newMessage = new Message({
        chatroom: chatroomId,
        user: socket.idUser,
        message,
      });
      io.to(chatroomId).emit("newMessage", {
        message,
        user: user,
        idUser: socket.idUser,
      });
      await newMessage.save();
    }
  });
});