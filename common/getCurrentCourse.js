const mongoose = require("mongoose");
const Course = mongoose.model("Course");

exports.getCurrentCourse = async () => {
    return await Course.findOne({ isCurrent: true });
}