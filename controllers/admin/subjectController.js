const mongoose = require("mongoose");
const Subject = mongoose.model("Subject");
const { HttpNotFound } = require('../../utils/errors');
const { getSubjectByAdmin } = require('../../services/DataMapper');
const _ = require('lodash');

exports.create = async (req, res) => {
    const subject = new Subject({
        name: req.body.name,
        idCourse: req.body.idCourse,
        config: req.body.config,
        idLecture: req.body.idLecture,
    });

    await subject.save();

    res.json({
        success: true,
        subject: await getSubjectByAdmin(subject),
        message: `Create new subject ${subject.name} successfully!`
    });
};

exports.findAll = async (req, res) => {
    const subjects = await Subject.find({});
    const allSubject = await Promise.all(subjects.map(async (value) => {
        return getSubjectByAdmin(value);
    }));

    res.json({
        success: true,
        allSubject: allSubject
    });
};

exports.filterSubjects = async (req, res) => {
    const page = parseInt(req.body.page);
    const size = parseInt(req.body.pageSize);
    const role = req.body.role ?
        [{ 'config.role': req.body.role }] :
        [{ 'config.role': 'public' },
        { 'config.role': 'private' }];
    const name = req.body.name || "";

    const subjects = await Subject.find({
        name: { $regex: new RegExp( name.toLowerCase(), "i") },
        $or: role
    }).skip((page - 1) * size).limit(size);
    const allSubject = await Promise.all(subjects.map(async (value) => {
        return getSubjectByAdmin(value);
    }));
    const total = await Subject.countDocuments({
        name: { $regex: new RegExp( name.toLowerCase(), "i") },
        $or: role
    })
    res.json({
        success: true,
        allSubject: allSubject,
        total
    });
};

exports.find = async (req, res) => {
    const subject = await Subject.findById(req.params.idSubject);
    if (!subject) {
        throw new HttpNotFound("Not found subject");
    }
    res.json({
        success: true,
        subject: await getSubjectByAdmin(value)
    });
}

exports.update = async (req, res) => {
    const subject = await Subject.findById(req.params.idSubject);
    if (!subject) {
        throw new HttpNotFound("Not found subject");
    }

    subject.name = req.body.name || subject.name;
    subject.config = req.body.config || subject.config;
    subject.idCourse = req.body.idCourse || subject.idCourse;
    subject.idLecture = req.body.idLecture || subject.idLecture;

    await subject.save();

    res.json({
        success: true,
        message: "Update Subject Successfully",
        subject: await getSubjectByAdmin(subject)
    });
};

exports.delete = async (req, res) => {
    const data = await Subject.findByIdAndDelete(req.params.idSubject)
    if (!data) {
        throw new HttpNotFound("Not found subject");
    }
    res.json({
        success: true,
        message: `Delete Subject ${data.name} Successfully`
    });

};

exports.hideOrUnhide = async (req, res) => {
    const subject = await Subject.findById(req.params.idSubject)
    if (!subject) {
        throw new HttpNotFound("Not found subject");
    }
    subject.isDeleted = !subject.isDeleted;
    await subject.save()
    let message;
    if (subject.isDeleted) {
        message = `Lock subject: ${subject.name} successfully!`;
    } else {
        message = `Unlock subject : ${subject.name} successfully!`;
    }
    res.json({
        success: true,
        message: message,
        subject: await getSubjectByAdmin(subject)
    });
};