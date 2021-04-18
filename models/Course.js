const mongoose = require("mongoose");

const Schema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name of course is required']
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Course", Schema);