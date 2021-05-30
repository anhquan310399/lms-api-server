const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const Classes = mongoose.model(schemaTitle.CLASS);
const User = mongoose.model(schemaTitle.USER);
const { HttpNotFound } = require('../../utils/errors');
const { AdminResponseMessages } = require('../../constants/ResponseMessages');
const { ClassResponseMessages } = AdminResponseMessages;
const PRIVILEGES = require('../../constants/PrivilegeCode');
const STATUS = require('../../constants/AccountStatus');
const DETAILS = require('../../constants/AccountDetail');

const findClassById = async (id) => {
    const cls = await Classes.findById(id);
    if (!cls) {
        throw new HttpNotFound(ClassResponseMessages.NOT_FOUND(id))
    }
    return cls;
}

exports.create = async (req, res) => {
    const data = new Classes({
        name: req.body.name,
        code: req.body.code,
    });

    const cls = await data.save();

    res.json({
        message: ClassResponseMessages.CREATE_SUCCESS,
        class: cls
    });
};

exports.findAll = async (req, res) => {
    const classes = await Classes.find();
    res.json({ classes });
};

exports.filter = async (req, res) => {
    const page = parseInt(req.body.page);
    const size = parseInt(req.body.pageSize);
    const name = req.body.name || "";

    const classes = await Classes.find({
        name: { $regex: new RegExp(name.toLowerCase(), "i") },
    }).skip((page - 1) * size).limit(size);

    const total = await Classes.countDocuments({
        name: { $regex: new RegExp(name.toLowerCase(), "i") },
    })
    res.json({
        success: true,
        classes: classes,
        total
    });
};

exports.update = async (req, res) => {

    const classroom = await findClassById(req.params.id);

    classroom.code = req.body.code;
    classroom.name = req.body.name;

    await classroom.save();

    res.json({
        message: ClassResponseMessages.UPDATE_SUCCESS,
        classroom
    });
};

exports.delete = async (req, res) => {

    const classroom = await findClassById(req.params.id);

    await Classes.findByIdAndRemove(classroom._id);

    res.json({
        message: ClassResponseMessages.DELETE_SUCCESS
    })
};

exports.addStudents = async (req, res) => {

    const classroom = await findClassById(req.params.id);

    const students = req.body.students;

    let ids = await Promise.all(students.map(async (student) => {
        console.log(student);
        const exist = await User.findOne({
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

    ids = classroom.students.concat(ids);

    ids = ids.filter((a, b) => ids.indexOf(a) === b);

    classroom.students = ids;

    await classroom.save();

    res.json({
        message: ClassResponseMessages.ADD_STUDENTS_SUCCESS
    })
};

exports.getAllStudents = async (req, res) => {

    const classroom = await findClassById(req.params.id);

    const students = await Promise.all(classroom.students.map(async (studentId) => {
        return User.findById(studentId,
            DETAILS.CONFIG_ADMIN);
    }));

    res.json({
        success: true,
        students
    })
}
