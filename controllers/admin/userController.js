const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const User = mongoose.model(schemaTitle.USER);
const { HttpNotFound } = require('../../utils/errors');
const DETAILS = require('../../constants/AccountDetail');
const PRIVILEGES = require('../../constants/PrivilegeCode');
const STATUS = require('../../constants/AccountStatus');

const { getConfigInfoOfUser } = require('../../services/DataHelpers');

const { AdminResponseMessages } = require('../../constants/ResponseMessages');
const { UserResponseMessages } = AdminResponseMessages;

const findUserById = async (id) => {
    const user = await User.findById(id);

    if (!user) {
        throw new HttpNotFound(UserResponseMessages.NOT_FOUND_BY_ID(id));
    }
    return user;
}

const filterUsers = async (req, privilege) => {
    const page = parseInt(req.body.page);
    const size = parseInt(req.body.size);
    const status = req.body.status ?
        [{ status: req.body.status }] :
        [{ status: STATUS.ACTIVATED },
        { status: STATUS.NOT_ACTIVATED },
        { status: STATUS.SUSPENDED }];
    const code = req.body.code || "";

    const users = await User.find({
        code: { $regex: new RegExp("^" + code.toLowerCase(), "i") },
        idPrivilege: privilege,
        $or: status
    },
        DETAILS.CONFIG_ADMIN).skip((page - 1) * size).limit(size);
    const total = await User.countDocuments({
        code: { $regex: new RegExp("^" + code.toLowerCase(), "i") },
        idPrivilege: privilege,
        $or: status
    });

    return {
        total,
        users
    }
}

exports.create = async (req, res) => {
    const data = new User({
        code: req.body.code,
        idPrivilege: req.body.idPrivilege,
        emailAddress: req.body.emailAddress,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        status: req.body.status
    });
    const user = await data.save();

    res.json({
        message: UserResponseMessages.CREATE_SUCCESS(user.idPrivilege),
        user: getConfigInfoOfUser(user)
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
    const { users, total } = await filterUsers(req, PRIVILEGES.STUDENT)
    res.json({
        success: true,
        users,
        total
    });
};

exports.filterTeachers = async (req, res) => {
    const { users, total } = await filterUsers(req, PRIVILEGES.TEACHER)
    res.json({
        success: true,
        users,
        total
    });
};

exports.filterRegisters = async (req, res) => {
    const { users, total } = await filterUsers(req, PRIVILEGES.REGISTER)
    res.json({
        success: true,
        users,
        total
    });
};

exports.filterAdministrators = async (req, res) => {
    const { users, total } = await filterUsers(req, PRIVILEGES.ADMIN)
    res.json({
        success: true,
        users,
        total
    });
};

exports.findUser = async (req, res) => {
    const user = await User.findOne({ code: req.params.code },
        DETAILS.CONFIG_ADMIN);
    res.json({ user });
};

exports.lockUser = async (req, res) => {
    const user = await findUserById(req.params.id);

    user.status = user.status !== STATUS.SUSPENDED
        ? STATUS.SUSPENDED : STATUS.NOT_ACTIVATED;

    await user.save();

    res.json({
        success: true,
        message: UserResponseMessages.LOCK_MESSAGE(user),
        user: getConfigInfoOfUser(user)
    });
};
