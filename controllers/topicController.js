const mongoose = require("mongoose");
const User = mongoose.model("User");
const { HttpNotFound, HttpUnauthorized } = require('../utils/errors');
const { getCommonInfoTopic, getDetailComment } = require('../services/DataMapper');
const { findForum, findTopic } = require('../services/DataSearcher');
exports.create = async (req, res) => {
    const subject = req.subject;
    const forum = findForum(subject, req);
    const model = {
        name: req.body.data.name,
        content: req.body.data.content,
        idUser: req.user._id
    };
    const length = forum.topics.push(model);

    await subject.save()
    const topic = forum.topics[length - 1];
    res.json({
        success: true,
        message: 'Create new topic successfully!',
        topic: await getCommonInfoTopic(topic)
    });
};

exports.find = async (req, res) => {
    const subject = req.subject;
    const { topic } = findTopic(subject, req);
    const discussions = await Promise.all(topic.discussions.map(async function (value) {
        return getDetailComment(value);
    }));

    const creator = await User.findById(topic.idUser, 'code firstName surName urlAvatar')

    res.json({
        success: true,
        topic: {
            _id: topic._id,
            name: topic.name,
            content: topic.content,
            create: creator,
            discussions: discussions,
            time: topic.createdAt
        }
    });
};

exports.update = async (req, res) => {
    const subject = req.subject;
    const { topic } = findTopic(subject, req);
    let isCreator = false;
    if (topic.idUser == req.user._id) {
        topic.name = req.body.data.name;
        topic.content = req.body.data.content;
        isCreator = true;
    }

    if (!isCreator) {
        throw new HttpUnauthorized("You isn't the topic creator. You can't change this topic!");
    }
    await subject.save()
    res.json({
        success: true,
        message: 'Update topic successfully!',
        topic: await getCommonInfoTopic(topic)
    });
};

exports.delete = async (req, res) => {
    const subject = req.subject
    const { forum, topic } = findTopic(subject, req);

    if (topic.idUser != req.user._id) {
        throw new HttpUnauthorized("You isn't the topic creator. You can't delete this topic!");
    }

    const indexTopic = forum.topics.indexOf(topic);

    forum.topics.splice(indexTopic, 1);

    await subject.save()

    res.json({
        success: false,
        message: "Delete topic successfully!"
    });
};