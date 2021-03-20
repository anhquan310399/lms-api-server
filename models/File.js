const mongoose = require("mongoose");


const file = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'name of file is required!']
    },
    type: {
        type: String,
        required: [true, 'type of file is required!']
    },
    path: {
        type: String,
        required: [true, 'path of file is required']
    },
    uploadDay: {
        type: Date,
        default: new Date(),
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
});


module.exports = file