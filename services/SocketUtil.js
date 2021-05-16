const { flatMap } = require("lodash");
const mongoose = require("mongoose");
const Subject = mongoose.model("Subject");
const { HttpNotFound } = require('../utils/errors');
const { getDetailComment } = require('../services/DataMapper');


const findTopicThroughSocket = async (idSubject, idTimeline, idForum, idTopic) => {
    const subject = await Subject.findById(idSubject);
    if (!subject) {
        throw new HttpNotFound("Not found subject");
    }

    const timeline = subject.timelines.find(value => value._id.equals(idTimeline));
    if (!timeline) {
        throw new HttpNotFound("Not found timeline");
    }

    const forum = timeline.forums.find(value => value._id.equals(idForum));
    if (!timeline) {
        throw new HttpNotFound("Not found forum");
    }

    const topic = forum.topics.find(value => value._id.equals(idTopic));
    if (!timeline) {
        throw new HttpNotFound("Not found topic");
    }

    return {
        subject,
        topic
    }

}


const discussThroughSocket = async (idSubject, idTimeline, idForum, idTopic, message, idUser) => {
    try {
        const { subject, topic } = await findTopicThroughSocket(idSubject, idTimeline, idForum, idTopic)

        const model = {
            content: message,
            idUser: idUser
        };

        const length = topic.discussions.push(model);

        await subject.save();

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

const isUserCanJoinRoom = async (idSubject, idUser) => {
    const subject = await Subject.findOne({
        _id: idSubject,
        $or: [{
            'studentIds': idUser
        }, {
            idLecture: idUser
        }]
    });
    if (subject) { return true; }
    else { return false }
}


module.exports = {
    discussThroughSocket,
    isUserCanJoinRoom
}