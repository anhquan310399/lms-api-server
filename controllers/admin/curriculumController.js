const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const Curriculum = mongoose.model(schemaTitle.CURRICULUM);
const { HttpNotFound } = require('../../utils/errors');
const { AdminResponseMessages } = require('../../constants/ResponseMessages');
const { CurriculumResponseMessages } = AdminResponseMessages;

const findCurriculumById = async (id) => {
    const curriculum = await Curriculum.findById(id);
    if (!curriculum) {
        throw new HttpNotFound(CurriculumResponseMessages.NOT_FOUND(id))
    }
    return curriculum;
}

exports.create = async (req, res) => {
    const data = new Curriculum({
        name: req.body.name,
        code: req.body.code,
        subjects: req.body.subjects,
        classes: req.body.classes
    });

    const curriculum = await data.save();

    res.json({
        message: CurriculumResponseMessages.CREATE_SUCCESS,
        curriculum
    });
};

exports.filter = async (req, res) => {
    const page = parseInt(req.body.page);
    const size = parseInt(req.body.size);
    const name = req.body.name || "";

    const filteredCurriculums = await Curriculum.find({
        name: { $regex: new RegExp(name.toLowerCase(), "i") },
    }).skip((page - 1) * size).limit(size);

    const total = await Curriculum.countDocuments({
        name: { $regex: new RegExp(name.toLowerCase(), "i") },
    })

    res.json({
        success: true,
        curriculums: filteredCurriculums,
        total
    });
}

exports.findAll = async (req, res) => {
    const curriculums = await Curriculum.find({}, 'name code');
    res.json({ curriculums });
};

exports.update = async (req, res) => {

    const curriculum = await findCurriculumById(req.params.id);

    curriculum.code = req.body.code;
    curriculum.name = req.body.name;
    curriculum.subjects = req.body.subjects;
    curriculum.classes = req.body.classes;

    curriculum.subjects = curriculum.subjects.filter((a, b) => curriculum.subjects.indexOf(a) === b);

    curriculum.classes = curriculum.classes.filter((a, b) => curriculum.classes.indexOf(a) === b);

    await curriculum.save();

    res.json({
        message: CurriculumResponseMessages.UPDATE_SUCCESS,
        curriculum
    });
};

exports.delete = async (req, res) => {

    const curriculum = await findCurriculumById(req.params.id);

    await Curriculum.findByIdAndRemove(curriculum._id);

    res.json({
        message: CurriculumResponseMessages.DELETE_SUCCESS
    })
};


