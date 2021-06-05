const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const Curriculum = mongoose.model(schemaTitle.CURRICULUM);
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


const getInfoSubjectsOfCurriculum = async (curriculum) => {
    let subjects = await Promise.all(curriculum.subjects.map(async (idSubject) => {
        return Subject.findById(idSubject, 'name');
    }))

    subjects = _.sortBy(subjects, 'name');

    return subjects;
}


exports.findAll = async (req, res) => {
    const curriculums = await Curriculum.find({}, 'name code');
    res.json({ curriculums });
};

exports.getAllSubjects = async (req, res) => {
    const curriculum = await findCurriculumById(req.params.id);

    const subjects = await getInfoSubjectsOfCurriculum(curriculum);

    res.json({
        success: true,
        subjects,
    })
}