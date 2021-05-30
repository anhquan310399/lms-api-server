const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const Faculty = mongoose.model(schemaTitle.FACULTY);
const { HttpNotFound } = require('../../utils/errors');
const { AdminResponseMessages } = require('../../constants/ResponseMessages');
const { FacultyResponseMessages } = AdminResponseMessages;

const findFacultyById = async (id) => {
    const faculty = await Faculty.findById(id);
    if (!faculty) {
        throw new HttpNotFound(FacultyResponseMessages.NOT_FOUND(id))
    }
    return faculty;
}

exports.create = async (req, res) => {
    const data = new Faculty({
        name: req.body.name,
        code: req.body.code,
        curriculums: req.body.curriculums,
    });

    const faculty = await data.save();

    res.json({
        message: FacultyResponseMessages.CREATE_SUCCESS,
        faculty
    });
};

exports.findAll = async (req, res) => {
    const faculties = await Faculty.find();
    res.json({ faculties });
};

exports.filter = async (req, res) => {
    const page = parseInt(req.body.page);
    const size = parseInt(req.body.size);
    const name = req.body.name || "";

    const filteredFaculties = await Faculty.find({
        name: { $regex: new RegExp(name.toLowerCase(), "i") },
    }).skip((page - 1) * size).limit(size);

    const total = await Faculty.countDocuments({
        name: { $regex: new RegExp(name.toLowerCase(), "i") }
    })

    res.json({
        success: true,
        faculties: filteredFaculties,
        total
    });
}

exports.update = async (req, res) => {

    const faculty = await findFacultyById(req.params.id);

    faculty.code = req.body.code;
    faculty.name = req.body.name;
    faculty.curriculums = req.body.curriculums;

    await faculty.save();

    res.json({
        message: FacultyResponseMessages.UPDATE_SUCCESS,
        faculty
    });
};

exports.delete = async (req, res) => {

    const faculty = await findFacultyById(req.params.id);

    await Faculty.findByIdAndRemove(faculty._id);

    res.json({
        message: FacultyResponseMessages.DELETE_SUCCESS
    })
};

exports.lock = async (req, res) => {
    const faculty = findFacultyById(req.params.id);

    faculty.isDeleted = !faculty.isDeleted;

    await faculty.save();

    res.json({
        success: true,
        message: FacultyResponseMessages.LOCK_MESSAGE(faculty),
        faculty
    });
};

