const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const Curriculum = mongoose.model(schemaTitle.CURRICULUM);
const Faculty = mongoose.model(schemaTitle.FACULTY);
const Subject = mongoose.model(schemaTitle.SUBJECT);
const { HttpNotFound } = require('../../utils/errors');
const { AdminResponseMessages } = require('../../constants/ResponseMessages');
const { CurriculumResponseMessages } = AdminResponseMessages;
const _ = require('lodash');

const findCurriculumById = async (id) => {
    const curriculum = await Curriculum.findById(id);
    if (!curriculum) {
        throw new HttpNotFound(CurriculumResponseMessages.NOT_FOUND(id))
    }
    return curriculum;
}

const getInfoCurriculum = async (curriculum) => {
    const faculty = await Faculty.findById(curriculum.idFaculty, 'name');
    return { ...curriculum['_doc'], faculty };
}

const getSubjectsOfCurriculum = async (curriculum) => {
    let subjects = await Promise.all(curriculum.subjects.map(async (idSubject) => {
        return Subject.findById(idSubject, 'name code credit');
    }))

    subjects = _.sortBy(subjects, 'name');

    return subjects;
}

exports.create = async (req, res) => {
    const data = new Curriculum({
        name: req.body.name,
        code: req.body.code,
        idFaculty: req.body.idFaculty
    });

    const curriculum = await data.save();

    res.json({
        message: CurriculumResponseMessages.CREATE_SUCCESS,
        curriculum: await getInfoCurriculum(curriculum)
    });
};

exports.getAllSubjects = async (req, res) => {
    const curriculum = await findCurriculumById(req.params.id);

    const subjects = await getSubjectsOfCurriculum(curriculum);

    const others = await Subject.find({
        _id: {
            $nin: curriculum.subjects
        }
    }, 'name')

    res.json({
        success: true,
        subjects,
        others
    })
}

exports.filter = async (req, res) => {
    const page = parseInt(req.body.page);
    const size = parseInt(req.body.size);
    const name = req.body.name || "";

    const filteredCurriculums = await Curriculum.find({
        name: { $regex: new RegExp(name.toLowerCase(), "i") }
    }, 'name code idFaculty').skip((page - 1) * size).limit(size);

    const curriculums = await Promise.all(filteredCurriculums.map(async (curriculum) => {
        return getInfoCurriculum(curriculum);
    }));

    const total = await Curriculum.countDocuments({
        name: { $regex: new RegExp(name.toLowerCase(), "i") },
    })

    res.json({
        success: true,
        curriculums: curriculums,
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
    curriculum.idFaculty = req.body.idFaculty;

    await curriculum.save();

    res.json({
        message: CurriculumResponseMessages.UPDATE_SUCCESS,
        curriculum: await getInfoCurriculum(curriculum)
    });
};

exports.addSubjects = async (req, res) => {
    const curriculum = await findCurriculumById(req.params.id);

    curriculum.subjects = curriculum.subjects.concat(req.body.subjects);

    curriculum.subjects = curriculum.subjects.filter((a, b) => curriculum.subjects.indexOf(a) === b);

    const others = await Subject.find({
        _id: {
            $nin: curriculum.subjects
        }
    }, 'name')

    await curriculum.save();

    res.json({
        message: CurriculumResponseMessages.UPDATE_SUCCESS,
        subjects: await getSubjectsOfCurriculum(curriculum),
        others
    });
}

exports.updateSubjects = async (req, res) => {
    const curriculum = await findCurriculumById(req.params.id);

    curriculum.subjects = req.body.subjects;

    curriculum.subjects = curriculum.subjects.filter((a, b) => curriculum.subjects.indexOf(a) === b);

    const others = await Subject.find({
        _id: {
            $nin: curriculum.subjects
        }
    }, 'name')

    await curriculum.save();

    res.json({
        message: CurriculumResponseMessages.UPDATE_SUCCESS,
        subjects: await getSubjectsOfCurriculum(curriculum),
        others
    });
}

exports.delete = async (req, res) => {

    const curriculum = await findCurriculumById(req.params.id);

    await Curriculum.findByIdAndRemove(curriculum._id);

    res.json({
        message: CurriculumResponseMessages.DELETE_SUCCESS
    })
};


