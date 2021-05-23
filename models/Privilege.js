const mongoose = require("mongoose");
const schemaTitle = require("../constants/SchemaTitle");
const { PrivilegeValidate } = require("../constants/ValidationMessage");

const Schema = mongoose.Schema({
    role: {
        type: String,
        unique: true,
        required: [true, PrivilegeValidate.ROLE]
    },
    name: {
        type: String,
        unique: true,
        required: [true, PrivilegeValidate.NAME]
    }
});


module.exports = mongoose.model(schemaTitle.PRIVILEGE, Schema);