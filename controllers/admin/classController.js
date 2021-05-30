const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const Classes = mongoose.model(schemaTitle.CLASS);
const User = mongoose.model(schemaTitle.USER);
const Curriculum = mongoose.model(schemaTitle.CURRICULUM);
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

const getInfoClass = async (cls) => {
    const curriculum = await Curriculum.findById(cls.idCurriculum, 'name');
    return { ...cls['_doc'], curriculum };
}


exports.create = async (req, res) => {
    const data = new Classes({
        name: req.body.name,
        code: req.body.code,
        idCurriculum: req.body.idCurriculum
    });

    const cls = await data.save();

    res.json({
        message: ClassResponseMessages.CREATE_SUCCESS,
        class: await getInfoClass(cls)
    });
};

exports.findAll = async (req, res) => {
    const classes = await Classes.find({}, 'name');
    res.json({ classes });
};

exports.filter = async (req, res) => {
    const page = parseInt(req.body.page);
    const size = parseInt(req.body.pageSize);
    const name = req.body.name || "";

    const filteredClasses = await Classes.find({
        name: { $regex: new RegExp(name.toLowerCase(), "i") },
    }).skip((page - 1) * size).limit(size);

    const classes = await Promise.all(filteredClasses.map(async (cls) => {
        return getInfoClass(cls);
    }));

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

    const cls = await findClassById(req.params.id);

    cls.code = req.body.code;
    cls.name = req.body.name;
    cls.idCurriculum = req.body.idCurriculum;

    await cls.save();

    res.json({
        message: ClassResponseMessages.UPDATE_SUCCESS,
        class: await getInfoClass(cls)
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

    const cls = await findClassById(req.params.id);

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

    ids = cls.students.concat(ids);

    ids = ids.filter((a, b) => ids.indexOf(a) === b);

    cls.students = ids;

    await cls.save();

    const students = await Promise.all(cls.students.map(async (studentId) => {
        return User.findById(studentId,
            DETAILS.CONFIG_ADMIN);
    }));

    res.json({
        message: ClassResponseMessages.ADD_STUDENTS_SUCCESS,
        students: students
    })
};

exports.updateStudents = async (req, res) => {
    const cls = await findClassById(req.params.id);

    const data = req.body.students;

    data = data.filter((a, b) => data.indexOf(a) === b);

    cls.students = data;

    await cls.save();

    const students = await Promise.all(cls.students.map(async (studentId) => {
        return User.findById(studentId,
            DETAILS.CONFIG_ADMIN);
    }));


    res.json({
        success: true,
        students,
        message: ClassResponseMessages.ADD_STUDENTS_SUCCESS,
    })
}

exports.getAllStudents = async (req, res) => {

    const cls = await findClassById(req.params.id);

    const students = await Promise.all(cls.students.map(async (studentId) => {
        return User.findById(studentId,
            DETAILS.CONFIG_ADMIN);
    }));

    res.json({
        success: true,
        students
    })
}
