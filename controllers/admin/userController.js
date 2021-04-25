const mongoose = require("mongoose");
const User = mongoose.model("User");
const { HttpNotFound } = require('../../utils/errors');
const DETAILS = require('../../constants/AccountDetail');
const PRIVILEGES = require('../../constants/PrivilegeCode');
const STATUS = require('../../constants/AccountStatus');

const getDetailConfigUser = (user) => {
    const { _id,
        code,
        idPrivilege,
        emailAddress,
        firstName,
        lastName,
        status,
        urlAvatar } = user

    return {
        _id,
        code,
        idPrivilege,
        emailAddress,
        firstName,
        lastName,
        status,
        urlAvatar
    }
}

exports.create = async (req, res) => {
    const user = new User({
        code: req.body.code,
        idPrivilege: req.body.idPrivilege,
        emailAddress: req.body.emailAddress,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        status: req.body.status
    });
    const data = await user.save();

    res.json({
        message: "Create new user successfully!",
        user: getDetailConfigUser(data)
    });
};

exports.findAll = async (req, res) => {
    const users = await User.find({}, DETAILS.CONFIG_ADMIN);
    res.json({
        success: true,
        users
    });
};

exports.findAllTeachers = async (req, res) => {
    const teachers = await User.find({
        idPrivilege: PRIVILEGES.TEACHER,
        status: STATUS.ACTIVATED
    },
        DETAILS.CONFIG_ADMIN);
    const total = await User.countDocuments({
        idPrivilege: PRIVILEGES.TEACHER,
        status: STATUS.ACTIVATED
    });

    res.json({
        success: true,
        users: teachers,
        total
    });
};

exports.filterStudents = async (req, res) => {
    const page = parseInt(req.body.page);
    const size = parseInt(req.body.size);
    const status = req.body.status ?
        [{ status: req.body.status }] :
        [{ status: STATUS.ACTIVATED },
        { status: STATUS.NOT_ACTIVATED },
        { status: STATUS.SUSPENDED }];
    const code = req.body.code || "";

    const students = await User.find({
        code: { $regex: new RegExp("^" + code.toLowerCase(), "i") },
        idPrivilege: PRIVILEGES.STUDENT,
        $or: status
    },
        DETAILS.CONFIG_ADMIN).skip((page - 1) * size).limit(size);
    const total = await User.countDocuments({
        code: { $regex: new RegExp("^" + code.toLowerCase(), "i") },
        idPrivilege: PRIVILEGES.STUDENT,
        $or: status
    });
    res.json({
        success: true,
        users: students,
        total
    });
};

exports.filterTeachers = async (req, res) => {
    const page = parseInt(req.body.page);
    const size = parseInt(req.body.size);
    const status = req.body.status ?
        [{ status: req.body.status }] :
        [{ status: STATUS.ACTIVATED },
        { status: STATUS.NOT_ACTIVATED },
        { status: STATUS.SUSPENDED }];
    const code = req.body.code || "";

    const teachers = await User.find({
        code: { $regex: new RegExp("^" + code.toLowerCase(), "i") },
        idPrivilege: PRIVILEGES.TEACHER,
        $or: status
    },
        DETAILS.CONFIG_ADMIN).skip((page - 1) * size).limit(size);
    const total = await User.countDocuments({
        code: { $regex: new RegExp("^" + code.toLowerCase(), "i") },
        idPrivilege: PRIVILEGES.TEACHER,
        $or: status
    });

    res.json({
        success: true,
        users: teachers,
        total
    });
};

exports.filterRegisters = async (req, res) => {
    const page = parseInt(req.body.page);
    const size = parseInt(req.body.size);
    const status = req.body.status ?
        [{ status: req.body.status }] :
        [{ status: STATUS.ACTIVATED },
        { status: STATUS.NOT_ACTIVATED },
        { status: STATUS.SUSPENDED }];
    const code = req.body.code || "";

    const registers = await User.find({
        code: { $regex: new RegExp("^" + code.toLowerCase(), "i") },
        idPrivilege: PRIVILEGES.REGISTER,
        $or: status
    },
        DETAILS.CONFIG_ADMIN).skip((page - 1) * size).limit(size);
    const total = await User.countDocuments({
        code: { $regex: new RegExp("^" + code.toLowerCase(), "i") },
        idPrivilege: PRIVILEGES.REGISTER,
        $or: status
    });
    res.json({
        success: true,
        users: registers,
        total
    });
};

exports.findUser = async (req, res) => {
    const user = await User.findOne({ code: req.params.code },
        DETAILS.CONFIG_ADMIN);
    res.json({ user });
};

exports.lockUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new HttpNotFound("Not found user");
    }
    user.status = user.status !== STATUS.SUSPENDED
        ? STATUS.SUSPENDED : STATUS.NOT_ACTIVATED;

    await user.save();
    const message = `${user.status !== STATUS.SUSPENDED ? 'Lock' : 'Unlock'} user "${user.lastName}" successfully!`;

    res.json({
        success: true,
        message: message,
        user: getDetailConfigUser(user)
    });
};
