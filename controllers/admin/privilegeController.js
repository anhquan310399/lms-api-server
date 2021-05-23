const mongoose = require("mongoose");
const schemaTitle = require("../../constants/SchemaTitle");
const Privilege = mongoose.model(schemaTitle.PRIVILEGE);
const { HttpNotFound } = require('../../utils/errors');
const { AdminResponseMessages } = require('../../constants/ResponseMessages');
const { PrivilegeResponseMessages } = AdminResponseMessages;

exports.create = async (req, res) => {
    const data = new Privilege({
        role: req.body.role,
        name: req.body.name
    });

    const privilege = await data.save();

    res.json({
        message: PrivilegeResponseMessages.CREATE_SUCCESS,
        privilege
    });
};

exports.findAll = async (req, res) => {
    const privileges = await Privilege.find();
    res.json({ privileges });
};

exports.findByRole = async (req, res) => {
    const privilege = await Privilege.findOne({ role: req.params.role });

    if (!privilege) {
        throw new HttpNotFound(PrivilegeResponseMessages.NOT_FOUND_BY_ROLE(req.params.role));
    } else {
        res.json({ privilege });
    }
};

exports.update = async (req, res) => {
    const privilege = await Privilege.findById(req.params.id);

    privilege.role = req.body.role;
    privilege.name = req.body.name;

    await privilege.save();

    res.json({
        message: PrivilegeResponseMessages.UPDATE_SUCCESS,
        privilege
    });
};

exports.delete = async (req, res) => {
    await Privilege.findByIdAndRemove(req.params.id);
    res.json({
        message: PrivilegeResponseMessages.DELETE_SUCCESS
    })
};