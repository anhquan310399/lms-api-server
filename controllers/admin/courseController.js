const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const Course = mongoose.model(schemaTitle.COURSE);
const Subject = mongoose.model(schemaTitle.SUBJECT);
const Classes = mongoose.model(schemaTitle.CLASS);
const User = mongoose.model(schemaTitle.USER);
const { HttpNotFound } = require('../../utils/errors');
const { getConfigInfoOfCourse } = require('../../services/DataHelpers');
const _ = require('lodash');
const DETAILS = require('../../constants/AccountDetail');

const { AdminResponseMessages } = require('../../constants/ResponseMessages');
const { CourseResponseMessages } = AdminResponseMessages;

const findCourseById = async (id) => {
    const course = await Course.findById(id);
    if (!course) {
        throw new HttpNotFound(CourseResponseMessages.NOT_FOUND(id));
    }
    return course;
}

const { getCodeOfNewCourse } = require("../../common/getCodeOfNewCourse");

exports.create = async (req, res) => {

    const subject = await Subject.findById(req.body.idSubject);

    if (!subject) {
        throw new HttpNotFound(CourseResponseMessages.NOT_FOUND_SUBJECT(req.body.idSubject));
    }

    const courseClass = await Classes.findById(req.body.idClass);

    if (!courseClass) {
        throw new HttpNotFound(CourseResponseMessages.NOT_FOUND_CLASS(req.body.idClass));
    }

    const { code, name } = await getCodeOfNewCourse(subject);

    const course = new Course({
        name: name,
        code: code,
        idSemester: req.body.idSemester,
        config: req.body.config,
        idTeacher: req.body.idTeacher,
        idSubject: subject._id,
        studentIds: courseClass.students
    });

    await course.save();

    res.json({
        success: true,
        course: await getConfigInfoOfCourse(course),
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
        courses: configData
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
        courses: allCourses,
        total
    });
};

exports.find = async (req, res) => {
    const course = await findCourseById(req.params.id);

    res.json({
        success: true,
        course: await getConfigInfoOfCourse(course)
    });
}

exports.update = async (req, res) => {
    const course = await findCourseById(req.params.id);

    course.name = req.body.name;
    course.config = req.body.config;
    course.idSemester = req.body.idSemester;
    course.idTeacher = req.body.idTeacher;

    await course.save();

    res.json({
        success: true,
        message: CourseResponseMessages.UPDATE_SUCCESS,
        course: await getConfigInfoOfCourse(course)
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
        course: await getConfigInfoOfCourse(course)
    });
};

exports.updateStudents = async (req, res) => {
    const course = await findCourseById(req.params.id);

    let data = req.body.students;

    data = data.filter((a, b) => data.indexOf(a) === b);

    course.studentIds = data;

    await course.save();

    const students = await Promise.all(course.studentIds.map(async (studentId) => {
        return User.findById(studentId,
            DETAILS.CONFIG_ADMIN);
    }));


    res.json({
        success: true,
        students,
        message: CourseResponseMessages.UPDATE_STUDENTS_SUCCESS,
    })
}

exports.getAllStudents = async (req, res) => {

    const course = await findCourseById(req.params.id);

    const students = await Promise.all(course.studentIds.map(async (studentId) => {
        return User.findById(studentId,
            DETAILS.CONFIG_ADMIN);
    }));

    res.json({
        success: true,
        students
    })
}

exports.addStudents = async (req, res) => {

    const course = await findCourseById(req.params.id);

    const data = req.body.students;

    let ids = await Promise.all(data.map(async(student) => {

        let exist = await User.findOne({
            $or: [
                { code: student.code }, { emailAddress: student.emailAddress }
            ]
        });

        if (!exist) {
            const data = new User({
                code: student.code,
                idPrivilege: PRIVILEGES.STUDENT,
                emailAddress: student.emailAddress,
                firstName: student.firstName,
                lastName: student.lastName,
                status: STATUS.NOT_ACTIVATED
            });
            exist = await data.save();
        }

        return exist._id;
    }));

    ids = course.studentIds.concat(ids);

    ids = ids.filter((a, b) => ids.indexOf(a) === b);

    course.studentIds = ids;

    await course.save();

    const students = await Promise.all(course.studentIds.map(async (studentId) => {
        return User.findById(studentId,
            DETAILS.CONFIG_ADMIN);
    }));

    res.json({
        message: CourseResponseMessages.ADD_STUDENTS_SUCCESS,
        students: students
    })
};