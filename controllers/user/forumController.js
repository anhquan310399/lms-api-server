const { getCommonInfo, getCommonInfoTopic } = require('../../services/DataHelpers');
const { findTimeline, findForum } = require('../../services/FindHelpers');
const { ClientResponsesMessages } = require('../../constants/ResponseMessages');
const { ForumResponseMessages } = ClientResponsesMessages

exports.create = async (req, res) => {
    const course = req.course;
    const timeline = findTimeline(course, req.body.idTimeline);
    const model = {
        name: req.body.data.name,
        description: req.body.data.description,
        isDeleted: req.body.data.isDeleted
    };

    const length = timeline.forums.push(model);

    await course.save()

    const forum = timeline.forums[length - 1];
    res.json({
        success: true,
        message: ForumResponseMessages.CREATE_SUCCESS,
        forum: getCommonInfo(forum)
    });
};

exports.find = async (req, res) => {
    const course = req.course;
    const { forum } = findForum(course, req.query.idTimeline, req.params.id, req.isStudent);
    const topics = await Promise.all(forum.topics.map(async topic => {
        return getCommonInfoTopic(topic);
    }))
    res.json({
        _id: forum._id,
        name: forum.name,
        description: forum.description,
        topics: topics
    })

};

exports.findUpdate = async (req, res) => {
    const course = req.course;
    const { forum } = findForum(course, req.query.idTimeline, req.params.id);

    res.json({
        success: true,
        forum: {
            _id: forum.id,
            name: forum.name,
            description: forum.description,
            isDeleted: forum.isDeleted
        }
    })
};

exports.findAll = async (req, res) => {
    const course = req.course;
    const timeline = findTimeline(course, req.query.idTimeline, req.isStudent);

    const forums = Promise.all(timeline.forums.reduce(async (result, forum) => {

        result = await result;

        if (forum.isDeleted && req.isStudent) {
            return result;
        } else {
            return [...result, {
                _id: value._id,
                name: value.name,
                description: value.description,
                isDeleted: req.isStudent ? undefined : forum.isDeleted
            }]
        }

    }, []))
    res.json({
        success: true,
        forums: forums
    })
};

exports.update = async (req, res) => {
    const course = req.course;
    const { forum } = findForum(course, req.body.idTimeline, req.params.id);

    const data = req.body.data;
    if (data.name) {
        forum.name = data.name;
    }
    if (data.description) {
        forum.description = data.description;
    }

    forum.isDeleted = data.isDeleted || false;

    await course.save();

    res.json({
        success: true,
        message: ForumResponseMessages.UPDATE_SUCCESS,
        forum: getCommonInfo(forum)
    });
};

exports.lock = async (req, res) => {
    const course = req.course;
    const { forum } = findForum(course, req.query.idTimeline, req.params.id);

    forum.isDeleted = !forum.isDeleted;

    await course.save()

    res.send({
        success: true,
        message: ForumResponseMessages.LOCK_MESSAGE(forum),
        forum: getCommonInfo(forum)
    });
};

exports.delete = async (req, res) => {
    const course = req.course;
    const { timeline, forum } = findForum(course, req.query.idTimeline, req.params.id);

    const index = timeline.forums.indexOf(forum);

    timeline.forums.splice(index, 1);

    await course.save();

    res.json({
        success: true,
        message: ForumResponseMessages.DELETE_SUCCESS
    });

};