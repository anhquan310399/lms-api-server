const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const Subject = mongoose.model(schemaTitle.SUBJECT);
const { HttpNotFound } = require('../../utils/errors');
const { AdminResponseMessages } = require('../../constants/ResponseMessages');
const { SubjectResponseMessages } = AdminResponseMessages;

const findSubjectById = async (id) => {
    const subject = await Subject.findById(id);
    if (!subject) {
        throw new HttpNotFound(SubjectResponseMessages.NOT_FOUND(id))
    }
    return subject;
}

exports.create = async (req, res) => {
    const data = new Subject({
        name: req.body.name,
        code: req.body.code,
        credit: req.body.credit,
    });

    const subject = await data.save();

    res.json({
        message: SubjectResponseMessages.CREATE_SUCCESS,
        subject
    });
};

exports.findAll = async (req, res) => {
    const subjects = await Subject.find();
    res.json({ subjects });
};

exports.update = async (req, res) => {

    const subject = await findSubjectById(req.params.id);

    subject.code = req.body.code;
    subject.name = req.body.name;
    subject.credit = req.body.credit;

    await subject.save();

    res.json({
        message: SubjectResponseMessages.UPDATE_SUCCESS,
        subject
    });
};

exports.delete = async (req, res) => {

    const subject = await findSubjectById(req.params.id);

    await Subject.findByIdAndRemove(subject._id);

    res.json({
        message: SubjectResponseMessages.DELETE_SUCCESS
    })
};

exports.lock = async (req, res) => {
    const subject = findSubjectById(req.params.id);

    subject.isDeleted = !subject.isDeleted;

    await subject.save();

    res.json({
        success: true,
        message: SubjectResponseMessages.LOCK_MESSAGE(subject),
        faculty: subject
    });
};
