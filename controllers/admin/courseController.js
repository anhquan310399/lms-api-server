const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const Course = mongoose.model(schemaTitle.COURSE);
const { HttpNotFound } = require('../../utils/errors');
const { getConfigInfoOfCourse } = require('../../services/DataMapper');
const _ = require('lodash');

const { AdminResponseMessages } = require('../../constants/ResponseMessages');
const { CourseResponseMessages } = AdminResponseMessages;

const findCourseById = async (id) => {
    const course = await Course.findById(req.params.id);
    if (!course) {
        throw new HttpNotFound(CourseResponseMessages.NOT_FOUND(req.params.id));
    }
}

exports.create = async (req, res) => {
    const course = new Course({
        name: req.body.name,
        idSemester: req.body.idSemester,
        config: req.body.config,
        idLecture: req.body.idLecture,
    });

    await course.save();

    res.json({
        success: true,
        subject: await getConfigInfoOfCourse(course),
        message: CourseResponseMessages.CREATE_SUCCESS(course.name)
    });
};

exports.findAll = async (req, res) => {
    const courses = await Course.find({});

    const configData = await Promise.all(courses.map(async (value) => {
        return getConfigInfoOfCourse(value);
    }));

    res.json({
        success: true,
        allCourses: configData
    });
};

exports.filter = async (req, res) => {
    const page = parseInt(req.body.page);
    const size = parseInt(req.body.pageSize);
    const role = req.body.role ?
        [{ 'config.role': req.body.role }] :
        [{ 'config.role': 'public' },
        { 'config.role': 'private' }];
    const name = req.body.name || "";

    const courses = await Course.find({
        name: { $regex: new RegExp(name.toLowerCase(), "i") },
        $or: role
    }).skip((page - 1) * size).limit(size);
    const allCourses = await Promise.all(courses.map(async (value) => {
        return getConfigInfoOfCourse(value);
    }));
    const total = await Course.countDocuments({
        name: { $regex: new RegExp(name.toLowerCase(), "i") },
        $or: role
    })
    res.json({
        success: true,
        allCourses: allCourses,
        total
    });
};

exports.find = async (req, res) => {
    const course = await findCourseById(req.params.id);

    res.json({
        success: true,
        subject: await getConfigInfoOfCourse(course)
    });
}

exports.update = async (req, res) => {
    const course = await findCourseById(req.params.id);

    course.name = req.body.name || course.name;
    course.config = req.body.config || course.config;
    course.idCourse = req.body.idCourse || course.idCourse;
    course.idLecture = req.body.idLecture || course.idLecture;

    await course.save();

    res.json({
        success: true,
        message: CourseResponseMessages.UPDATE_SUCCESS,
        subject: await getConfigInfoOfCourse(course)
    });
};

exports.delete = async (req, res) => {
    const course = await findCourseById(req.params.id);

    await Course.findByIdAndDelete(course._id);

    res.json({
        success: true,
        message: CourseResponseMessages.DELETE_SUCCESS(course.name)
    });

};

exports.lock = async (req, res) => {
    const course = await findCourseById(req.params.id);

    course.isDeleted = !course.isDeleted;

    await course.save();

    res.json({
        success: true,
        message: CourseResponseMessages.LOCK_MESSAGE(course),
        subject: await getConfigInfoOfCourse(course)
    });
};