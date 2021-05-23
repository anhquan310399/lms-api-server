const mongoose = require("mongoose");
const schemaTitle = require("../constants/SchemaTitle");
const Semester = mongoose.model(schemaTitle.SEMESTER);

exports.getCurrentSemester = async () => {
    return await Semester.findOne({ isCurrent: true });
}