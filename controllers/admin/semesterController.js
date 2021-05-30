const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const Semester = mongoose.model(schemaTitle.SEMESTER);
const Course = mongoose.model(schemaTitle.COURSE);
const { HttpNotFound } = require('../../utils/errors');
const { AdminResponseMessages } = require('../../constants/ResponseMessages');
const { SemesterResponseMessages } = AdminResponseMessages;


const getBasicInfoSemester = async (semester) => {
    return {
        _id: semester._id,
        name: semester.name,
        subjects: await Course.countDocuments({ idSemester: semester._id }),
        isCurrent: semester.isCurrent
    }
}

const findSemesterById = async (id) => {
    const semester = await Semester.findById(id);

    if (!semester) {
        throw new HttpNotFound(SemesterResponseMessages.NOT_FOUND_BY_ID(id));
    }

    return semester;
}

exports.create = async (req, res) => {
    const data = new Semester({
        name: req.body.name
    });

    const semester = await data.save();

    res.json({
        semester: await getBasicInfoSemester(semester),
        message: SemesterResponseMessages.CREATE_SUCCESS(semester.name)
    });
};

exports.findAll = async (req, res) => {
    const semesters = await Semester.find();
    res.json({
        success: true,
        semesters
    });
};

exports.filter = async (req, res) => {
    const page = parseInt(req.body.page);
    const size = parseInt(req.body.pageSize);
    const name = req.body.name || "";

    const filteredSemesters = await Semester.find({
        name: { $regex: new RegExp(name.toLowerCase(), "i") },
    }).skip((page - 1) * size).limit(size);

    const semesters = await Promise.all(filteredSemesters.map(async (course) =>
        getBasicInfoSemester(course)
    ));

    const total = await Semester.countDocuments({
        name: { $regex: new RegExp(name.toLowerCase(), "i") },
    })

    res.json({
        success: true,
        semesters: semesters,
        total
    });
}

exports.findById = async (req, res) => {
    const semester = await findSemesterById(req.params.id);

    res.json({
        semester: getBasicInfoSemester(semester),
    });

};

exports.update = async (req, res) => {
    const semester = await findSemesterById(req.params.id);

    semester.name = req.body.name;

    await semester.save();

    res.json({
        semester: await getBasicInfoSemester(semester),
        message: SemesterResponseMessages.UPDATE_SUCCESS
    });
};

exports.setCurrent = async (req, res) => {
    const semester = await findSemesterById(req.params.id);

    await Semester.updateMany({
        _id: { "$ne": semester._id },
        isCurrent: true
    }, { isCurrent: false });

    semester.isCurrent = true;

    await semester.save();

    res.json({
        success: true,
        message: SemesterResponseMessages.SET_CURRENT(semester.name),
        course: await getBasicInfoSemester(semester)
    });
};