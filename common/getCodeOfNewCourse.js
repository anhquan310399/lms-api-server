const mongoose = require("mongoose");
const schemaTitle = require("../constants/SchemaTitle");
const Course = mongoose.model(schemaTitle.COURSE);
const { getCurrentSemester } = require('./getCurrentSemester');

const getCodeOfNewCourse = async (subject) => {
    const semester = await getCurrentSemester();

    let code = semester.name + "_" + subject.code + "_Group_";

    const total = await Course.countDocuments({
        code: { $regex: new RegExp("^" + code.toLowerCase(), "i") }
    });

    code += (total + 1);

    const name = subject.name + "_Group_" + (total + 1);

    return { name, code };
}

module.exports = {
    getCodeOfNewCourse
}