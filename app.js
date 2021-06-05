const express = require("express");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(require('cors')());

app.use("/chatroom", require("./routes/chatroomRoute"));
app.use("/admin", require("./routes/admin/admin"));
app.use("/user", require("./routes/userRoute"));
app.use("/survey-bank", require("./routes/surveyBankRoute"));
app.use("/course", require("./routes/course/courseRoute"));
app.use("/timeline", require("./routes/course/timelineRoute"));
app.use("/announcement", require("./routes/course/announceRoute"));
app.use("/assignment", require("./routes/course/assignmentRoute"));
app.use("/forum", require("./routes/course/forumRoute"));
app.use("/topic", require("./routes/course/topicRoute"));
app.use("/quiz-bank", require("./routes/course/quizBankRoute"));
app.use("/exam", require("./routes/course/examRoute"));
app.use("/survey", require("./routes/course/surveyRoute"));
app.use("/curriculum", require("./routes/curriculumRoute"));

const jwt = require('jsonwebtoken')
app.get("/verify", (req, res) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, process.env.JWT_KEY)
        res.json({
            success: true
        })
    } catch (err) {
        res.status(404).json({
            success: false
        })
    }
})

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