const { HttpNotFound, HttpUnauthorized } = require('../../utils/errors');
const { getCommonInfoTopic, getDetailComment, getUserById } = require('../../services/DataHelpers');
const { findForum, findTopic } = require('../../services/FindHelpers');
const DETAILS = require("../../constants/AccountDetail");
const { ClientResponsesMessages } = require('../../constants/ResponseMessages');
const { TopicResponseMessages } = ClientResponsesMessages


exports.create = async (req, res) => {
    const course = req.course;
    const { forum } = findForum(course, req.query.idTimeline, req.query.idForum, req.isStudent);
    const model = {
        name: req.body.data.name,
        content: req.body.data.content,
        idUser: req.user._id
    };

    const length = forum.topics.push(model);

    await course.save();

    const topic = forum.topics[length - 1];

    res.json({
        success: true,
        message: TopicResponseMessages.CREATE_SUCCESS,
        topic: await getCommonInfoTopic(topic)
    });
};

exports.find = async (req, res) => {
    const course = req.course;
    const { topic } = findTopic(course, req.query.idTimeline, req.query.idForum, req.params.idTopic, req.isStudent);

    const discussions = await Promise.all(topic.discussions.map(async function (value) {
        return getDetailComment(value);
    }));

    const creator = await getUserById(topic.idUser, DETAILS.COMMON)

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
    const course = req.course;
    const { topic } = findTopic(course, req.body.idTimeline, req.body.idForum, req.params.idTopic, req.isStudent);

    if (!topic.idUser.equals(req.user._id)) {
        throw new HttpUnauthorized(TopicResponseMessages.TOPIC_IS_NOT_OWN);
    }

    topic.name = req.body.data.name;
    topic.content = req.body.data.content;

    await course.save()
    res.json({
        success: true,
        message: TopicResponseMessages.UPDATE_SUCCESS,
        topic: await getCommonInfoTopic(topic)
    });
};

exports.delete = async (req, res) => {
    const course = req.course;

    const { forum, topic } = findTopic(course, req.query.idTimeline, req.query.idForum, req.params.idTopic, req.isStudent);

    if (!topic.idUser.equals(req.user._id)) {
        throw new HttpUnauthorized(TopicResponseMessages.TOPIC_IS_NOT_OWN);
    }

    const index = forum.topics.indexOf(topic);

    forum.topics.splice(index, 1);

    await course.save();

    res.json({
        success: false,
        message: TopicResponseMessages.DELETE_SUCCESS
    });
};

exports.discuss = async (req, res) => {
    const course = req.course;
    const { topic } = findTopic(course, req.body.idTimeline, req.body.idForum, req.params.idTopic, req.isStudent);

    const model = {
        content: req.body.data.content,
        idUser: req.user._id
    };

    const length = topic.discussions.push(model);

    await course.save();

    res.json({
        success: true,
        discussion: await getDetailComment(topic.discussions[length - 1])
    });
};

exports.updateDiscussion = async (req, res) => {
    const course = req.course;

    const { topic } = findTopic(course, req.body.idTimeline, req.body.idForum, req.params.idTopic, req.isStudent);

    const discussion = topic.discussions.find(value => value._id.equals(req.params.idDiscussion));

    if (!discussion) {
        throw new HttpNotFound(TopicResponseMessages.NOT_FOUND_DISCUSSION);
    }

    if (!discussion.idUser.equals(req.user._id)) {
        throw new HttpUnauthorized(TopicResponseMessages.DISCUSSION_IS_NOT_OWN);
    }

    discussion.content = req.body.data.content;

    await course.save();
    res.send({
        success: true,
        message: TopicResponseMessages.UPDATE_DISCUSSION_SUCCESS,
        discussion: await getDetailComment(discussion)
    });
};

exports.deleteDiscussion = async (req, res) => {
    const course = req.course;

    const { topic } = findTopic(course, req.body.idTimeline, req.body.idForum, req.params.idTopic, req.isStudent);

    const discussion = topic.discussions.find(value => value._id.equals(req.params.idDiscussion));

    if (!discussion) {
        throw new HttpNotFound(TopicResponseMessages.NOT_FOUND_DISCUSSION);
    }

    if (!discussion.idUser.equals(req.user._id)) {
        throw new HttpUnauthorized(TopicResponseMessages.DISCUSSION_IS_NOT_OWN);
    }

    const index = topic.discussions.indexOf(discussion);

    topic.discussions.splice(index, 1);

    await course.save();

    res.send({
        success: true,
        message: TopicResponseMessages.DELETE_DISCUSSION_SUCCESS
    });
};