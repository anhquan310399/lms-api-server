const mongoose = require("mongoose");
const Course = mongoose.model("Course");
const Subject = mongoose.model("Subject");
const { HttpNotFound } = require('../../utils/errors');

const getCourseByAdmin = async (course) => {
    return {
        _id: course._id,
        name: course.name,
        subjects: await Subject.countDocuments({ idCourse: course._id }),
        isCurrent: course.isCurrent
    }
}

exports.create = async (req, res) => {
    const data = new Course({
        name: req.body.name
    });

    const course = await data.save();
    res.json({
        course: getCourseByAdmin(course),
        message: `Add new course "${course.name}" successfully`
    });
};

exports.findAll = async (req, res) => {
    const courses = await Course.find();
    res.json({
        success: true,
        courses
    });
};

exports.filterCourses = async (req, res) => {
    const page = parseInt(req.body.page);
    const size = parseInt(req.body.pageSize);
    const name = req.body.name || "";

    const courses = await Course.find({
        name: { $regex: new RegExp(name.toLowerCase(), "i") },
    }).skip((page - 1) * size).limit(size);
    const allCourses = await Promise.all(courses.map(async (course) =>
        getCourseByAdmin(course)
    ));

    res.json({
        success: true,
        courses: allCourses
    });
}

exports.findById = async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) {
        throw new HttpNotFound(`Not found privilege with role ${req.params.id}`);
    } else {
        res.json({
            course: getCourseByAdmin(course),
        });
    }
};

exports.update = async (req, res) => {
    const course = await Course.findById(req.params.id);

    course.name = req.body.name;

    await course.save();

    res.json({
        course: await getCourseByAdmin(course),
        message: `Update course successfully`
    });
};

exports.setCurrentCourse = async (req, res) => {
    const course = await Course.findById(req.params.id)
    if (!course) {
        throw new HttpNotFound("Not found course");
    }

    await Course.updateMany({
        _id: { "$ne": course._id },
        isCurrent: true
    }, { isCurrent: false });
    course.isCurrent = true;
    await course.save();

    res.json({
        success: true,
        message: `Set course: ${course.name} to current course of lms successfully!`,
        course: await getCourseByAdmin(course)
    });
};