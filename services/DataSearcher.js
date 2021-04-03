const { HttpNotFound } = require('../utils/errors');

const findTimeline = (subject, req) => {
    const id = req.query.idTimeline || req.params.idTimeline || req.body.idTimeline
    const timeline = subject.timelines.find(value => value._id == id);
    if (!timeline || (req.idPrivilege === 'student' && timeline.isDeleted === true)) {
        throw new HttpNotFound("Not found timeline");
    }
    return timeline;
}

const findForum = (subject, req) => {
    const timeline = findTimeline(subject, req);
    const id = req.query.idForum || req.params.idForum || req.body.idForum
    const forum = timeline.forums.find(value => value._id == id);
    if (!forum || (req.idPrivilege === 'student' && forum.isDeleted === true)) {
        throw new HttpNotFound("Not found forum");
    }
    return { timeline, forum }
}

const findTopic = (subject, req) => {
    const { timeline, forum } = findForum(subject, req);
    const id = req.query.idTopic || req.params.idTopic || req.body.idTopic
    const topic = forum.topics.find(value => value._id == id)
    if (!topic) {
        throw new HttpNotFound("Not found topic");
    }
    return { timeline, forum, topic };
}

const findAssignment = (subject, req) => {
    const timeline = findTimeline(subject, req);
    const id = req.query.idAssignment || req.params.idAssignment || req.body.idAssignment
    const assignment = timeline.assignments.find(value => value._id == id);
    if (!assignment || (req.idPrivilege === 'student' && assignment.isDeleted === true)) {
        throw new HttpNotFound("Not found assignment");
    }
    return { timeline, assignment };
}

const findAnnouncement = (subject, req) => {
    const timeline = findTimeline(subject, req);
    const id = req.query.id || req.params.id || req.body.id
    const announcement = timeline.announcements.find(value => value._id == id);
    if (!announcement) {
        throw new HttpNotFound("Not found announcement");
    }
    return { timeline, announcement }
}

module.exports = {
    findTimeline,
    findForum,
    findTopic,
    findAssignment,
    findAnnouncement
}