const mongoose = require("mongoose");

const privilegeSchema = mongoose.Schema({
    role: {
        type: String,
        unique: true,
        required: [true, 'role is required']
    },
    name: {
        type: String,
        unique: true,
        required: [true, 'name of privilege is required']
    }
});


module.exports = mongoose.model("Privilege", privilegeSchema);