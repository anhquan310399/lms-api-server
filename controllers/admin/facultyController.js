const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const Faculty = mongoose.model(schemaTitle.FACULTY);
const { HttpNotFound } = require('../../utils/errors');
const { AdminResponseMessages } = require('../../constants/ResponseMessages');
const { FacultyResponseMessages } = AdminResponseMessages;

const findFacultyById =async (id) => {
    const faculty = await Faculty.findById(id);
    if (!faculty) {
        throw new HttpNotFound(FacultyResponseMessages.NOT_FOUND(id))
    }
    return faculty;
}

exports.create = async (req, res) => {
    const data = new Faculty({
        name: req.body.name,
        code: req.body.code
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

exports.update = async (req, res) => {

    const faculty = await findFacultyById(req.params.id);

    faculty.code = req.body.code;
    faculty.name = req.body.name;

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

