const mongoose = require("mongoose");

const announcementSchema = require("./Announcement");
const forumSchema = require("./Forum");
const assignmentSchema = require("./Assignment");
const examSchema = require("./Exam");
const surveySchema = require("./Survey");
const fileSchema = require("./File");
const { TimelineValidate } = require("../../constants/ValidationMessage");

const timeline = new mongoose.Schema({
    name: {
        type: String,
        required: [true, TimelineValidate.NAME]
    },
    description: String,
    surveys: [surveySchema],
    forums: [forumSchema],
    exams: [examSchema],
    announcements: [announcementSchema],
    assignments: [assignmentSchema],
    files: [fileSchema],
    isDeleted: {
        type: Boolean,
        default: false
    },
    index: {
        type: mongoose.Schema.Types.Number,
        min: 1,
        required: true
    }

}, {
    timestamps: true,
});

// timeline.pre('save', async function(next) {
//     let currentTimeline = this;
//     if (!currentTimeline.isModified('isDeleted')) {
//         return next();
//     }

//     if (currentTimeline.isDeleted === true) {
//         currentTimeline.exams.forEach(element => {
//             element.isDeleted = true;
//         });
//         currentTimeline.assignments.forEach(element => {
//             element.isDeleted = true;
//         });
//         currentTimeline.forums.forEach(element => {
//             element.isDeleted = true;
//         });
//     } else {
//         currentTimeline.exams.forEach(element => {
//             element.isDeleted = false;
//         });
//         currentTimeline.assignments.forEach(element => {
//             element.isDeleted = false;
//         });
//         currentTimeline.forums.forEach(element => {
//             element.isDeleted = false;
//         });
//     }

// })



module.exports = timeline