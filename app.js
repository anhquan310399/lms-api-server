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
app.use("/quiz-bank", require("./routes/quizBank"));
app.use("/survey-bank", require("./routes/surveyBank"));
app.use("/exam", require("./routes/exam"));
app.use("/survey", require("./routes/survey"));
app.use("/zoom", require("./routes/zoom"));
app.use("/course", require("./routes/course"));

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