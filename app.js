const express = require("express");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(require('cors')());

app.use("/chatroom", require("./routes/chatroom"));
app.use("/user", require("./routes/user"));
app.use("/privilege", require("./routes/privilege"));
app.use("/subject", require("./routes/subject"));
app.use("/timeline", require("./routes/timeline"));
app.use("/announcement", require("./routes/announcement"));
app.use("/assignment", require("./routes/assignment"));
app.use("/forum", require("./routes/forum"));
app.use("/topic", require("./routes/topic"));
app.use("/quiz", require("./routes/quizBank"));
app.use("/survey", require("./routes/surveyBank"));

//Setup Error Handlers
const errorHandlers = require("./handlers/errorHandlers");
app.use(errorHandlers.notFound);
app.use(errorHandlers.mongoseErrors);
if (process.env.ENV === "DEVELOPMENT") {
  app.use(errorHandlers.developmentErrors);
} else {
  app.use(errorHandlers.productionErrors);
}

module.exports = app;