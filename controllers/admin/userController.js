const mongoose = require("mongoose");
const User = mongoose.model("User");
const { HttpNotFound } = require('../../utils/errors');
const DETAILS = require('../../constants/AccountDetail');
const PRIVILEGES = require('../../constants/PrivilegeCode');

exports.create = async(req, res) => {
    const user = new User({
        code: req.body.code,
        idPrivilege: req.body.idPrivilege,
        emailAddress: req.body.emailAddress,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        status: req.body.status
    });
    const data = await user.save();

    res.json(data);
};

exports.findAll = async(req, res) => {
    const users = await User.find();
    res.json(users);
};

exports.findAllStudents = async(req, res) => {
    const students = await User.find({ idPrivilege: PRIVILEGES.STUDENT },
        DETAILS.CONFIG_ADMIN);
    res.json(students);
};

exports.findAllTeachers = async(req, res) => {
    const teachers = await User.find({ idPrivilege: PRIVILEGES.TEACHER },
        DETAILS.CONFIG_ADMIN);
    res.json(teachers);
};

exports.findUser = async(req, res) => {
    const user = await User.findOne({ code: req.params.code },
        DETAILS.CONFIG_ADMIN);
    res.json(user);
};

exports.hideOrUnhide = async(req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new HttpNotFound("Not found user");
    }
    user.isDeleted = !user.isDeleted;

    await user.save();
    const message = `${user.isDeleted?'Lock':'Unlock'} user with code: ${user.code} successfully!`;

    res.json({
        success: true,
        message: message,
    });
};