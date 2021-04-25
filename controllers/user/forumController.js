const { getCommonData, getCommonInfoTopic } = require('../../services/DataMapper');
const { findTimeline, findForum } = require('../../services/DataSearcher');
const PRIVILEGES = require("../../constants/PrivilegeCode");

exports.create = async (req, res) => {
    const subject = req.subject;
    const timeline = findTimeline(subject, req);
    const model = {
        name: req.body.data.name,
        description: req.body.data.description,
        isDeleted: req.body.data.isDeleted
    };

    const length = timeline.forums.push(model);

    await subject.save()

    const forum = timeline.forums[length - 1];
    res.json({
        success: true,
        message: 'Create new forum successfully!',
        forum: getCommonData(forum)
    });
};

exports.find = async (req, res) => {
    const subject = req.subject;
    const { forum } = findForum(subject, req);
    const topics = await Promise.all(forum.topics.map(async value => {
        return getCommonInfoTopic(value);
    }))
    res.json({
        _id: forum._id,
        name: forum.name,
        description: forum.description,
        topics: topics
    })

};

exports.findUpdate = async (req, res) => {
    const subject = req.subject;
    const { forum } = findForum(subject, req);

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
    const subject = req.subject;
    const timeline = findTimeline(subject, req);
    const index = subject.timelines.indexOf(timeline);

    let forums = subject.timelines[index].forums;

    forums = forums.reduce((res, value) => {
        if (!(value.isDeleted && req.user.idPrivilege !== PRIVILEGES.TEACHER)) {
            res.push({
                _id: value._id,
                name: value.name,
                description: value.description,
                isDeleted: req.user.idPrivilege !== PRIVILEGES.TEACHER ? undefined : value.isDeleted
            })
        }
        return res;
    }, [])
    res.json({
        success: true,
        forums: forums
    })
};

exports.update = async (req, res) => {
    const subject = req.subject;
    const { forum } = findForum(subject, req);
    const data = req.body.data;
    if (data.name) {
        forum.name = data.name;
    }
    if (data.description) {
        forum.description = data.description;
    }

    forum.isDeleted = data.isDeleted || false;

    await subject.save()
    res.json({
        success: true,
        message: 'Update forum successfully!',
        forum: getCommonData(forum)
    });
};

exports.hideOrUnhide = async (req, res) => {
    const subject = req.subject;
    const { forum } = findForum(subject, req);
    forum.isDeleted = !forum.isDeleted;

    await subject.save()

    res.send({
        success: true,
        message: `${forum.isDeleted ? "Hide" : "Unhide"} forum ${forum.name} successfully!`,
        forum: getCommonData(forum)
    });
};

exports.delete = async (req, res) => {
    const subject = req.subject;
    const { timeline, forum } = findForum(subject, req);
    const index = timeline.forums.indexOf(forum);

    timeline.forums.splice(index, 1);
    await subject.save()
    res.json({
        success: true,
        message: "Delete forum successfully!"
    });

};