const mongoose = require("mongoose");
const Course = mongoose.model("Course");
const { HttpNotFound } = require('../../utils/errors');

exports.create = async(req, res) => {
    const course = new Course({
        name: req.body.name
    });

    const data = await course.save();
    res.json(data);
};

exports.findAll = async(req, res) => {
    const courses = await Course.find();
    res.json({
        success: true,
        courses
    });
};

exports.findById = async(req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) {
        throw new HttpNotFound(`Not found privilege with role ${req.params.id}`);
    } else {
        res.json(course);
    }
};

exports.update = async(req, res) => {
    let course = await Course.findById(req.params.id);

    course.name = req.body.name;

    await course.save();

    res.json(course);
};

exports.delete = async(req, res) => {
    const course = await Course.findById(req.params.id)
    if (!course) {
        throw new HttpNotFound("Not found course");
    }
    course.isDeleted = !course.isDeleted;
    await course.save()
    let message;
    if (course.isDeleted) {
        message = `Lock course: ${course.name} successfully!`;
    } else {
        message = `Unlock course : ${course.name} successfully!`;
    }
    res.json({
        success: true,
        message: message,
        course: course
    });
};