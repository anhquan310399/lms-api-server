const mongoose = require("mongoose");
const schemaTitle = require("../constants/SchemaTitle");
const Course = mongoose.model(schemaTitle.COURSE);
const { HttpNotFound } = require('../utils/errors');
const { getDetailComment } = require('../services/DataHelpers');
const { findTopic } = require('../services/FindHelpers');

const findTopicThroughSocket = async (idCourse, idTimeline, idForum, idTopic) => {
    const course = await Course.findById(idCourse);
    if (!course) {
        throw new HttpNotFound("Not found course");
    }

    const { topic } = findTopic(course, idTimeline, idForum, idTopic);

    return {
        course,
        topic
    }

}


const discussThroughSocket = async (idCourse, idTimeline, idForum, idTopic, message, idUser) => {
    try {
        const { course, topic } = await findTopicThroughSocket(idCourse, idTimeline, idForum, idTopic)

        const model = {
            content: message,
            idUser: idUser
        };

        const length = topic.discussions.push(model);

        await course.save();

        const discussion = await getDetailComment(topic.discussions[length - 1]);

        return {
            success: true,
            discussion
        }
    } catch (err) {
        return {
            success: false,
            message: err.message
        }
    }
}

const isUserCanJoinRoom = async (idCourse, idUser) => {
    const course = await Course.findOne({
        _id: idCourse,
        $or: [{
            'studentIds': idUser
        }, {
            idTeacher: idUser
        }]
    });
    if (course) { return true; }
    else { return false }
}


module.exports = {
    discussThroughSocket,
    isUserCanJoinRoom
}