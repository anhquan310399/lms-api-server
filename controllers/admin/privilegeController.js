const mongoose = require("mongoose");
const Privilege = mongoose.model("Privilege");
const { HttpNotFound } = require('../../utils/errors');
exports.create = async(req, res) => {
    const privilege = new Privilege({
        role: req.body.role,
        name: req.body.name
    });

    const data = await privilege.save();

    res.json(data);
};

exports.findAll = async(req, res) => {
    const privileges = await Privilege.find();
    res.json(privileges);
};

exports.findByRole = async(req, res) => {
    const privilege = await Privilege.findOne({ role: req.params.role });
    if (!privilege) {
        throw new HttpNotFound(`Not found privilege with role ${req.params.role}`);
    } else {
        res.json(privilege);
    }
};

exports.update = async(req, res) => {
    let privilege = await Privilege.findById(req.params.id);

    console.log(privilege);

    privilege.role = req.body.role;
    privilege.name = req.body.name;

    await privilege.save();

    res.json(privilege);
};

exports.delete = async(req, res) => {
    await Privilege.findByIdAndRemove(req.params.id);
    res.json({
        message: 'Delete role successfully!'
    })
};