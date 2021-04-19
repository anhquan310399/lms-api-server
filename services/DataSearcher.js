const { HttpNotFound } = require('../utils/errors');
const PRIVILEGES = require('../constants/PrivilegeCode');

const findTimeline = (subject, req) => {
    const id = req.query.idTimeline || req.params.idTimeline || req.body.idTimeline
    const timeline = subject.timelines.find(value => value._id.equals(id));
    if (!timeline ||
        ((
            req.user.idPrivilege === PRIVILEGES.STUDENT ||
            req.user.idPrivilege === PRIVILEGES.REGISTER
        ) && timeline.isDeleted === true)) {
        throw new HttpNotFound("Not found timeline");
    }
    return timeline;
}

const findForum = (subject, req) => {
    const timeline = findTimeline(subject, req);
    const id = req.query.idForum || req.params.idForum || req.body.idForum
    const forum = timeline.forums.find(value => value._id.equals(id));
    if (!forum || ((req.user.idPrivilege === PRIVILEGES.STUDENT || req.user.idPrivilege === PRIVILEGES.REGISTER) && forum.isDeleted === true)) {
        throw new HttpNotFound("Not found forum");
    }
    return { timeline, forum }
}

const findTopic = (subject, req) => {
    const { timeline, forum } = findForum(subject, req);
    const id = req.query.idTopic || req.params.idTopic || req.body.idTopic
    const topic = forum.topics.find(value => value._id.equals(id))
    if (!topic) {
        throw new HttpNotFound("Not found topic");
    }
    return { timeline, forum, topic };
}

const findAssignment = (subject, req) => {
    const timeline = findTimeline(subject, req);
    const id = req.query.idAssignment || req.params.idAssignment || req.body.idAssignment
    const assignment = timeline.assignments.find(value => value._id.equals(id));
    if (!assignment || ((req.user.idPrivilege === PRIVILEGES.STUDENT || req.user.idPrivilege === PRIVILEGES.REGISTER) && assignment.isDeleted === true)) {
        throw new HttpNotFound("Not found assignment");
    }
    return { timeline, assignment };
}

const findAnnouncement = (subject, req) => {
    const timeline = findTimeline(subject, req);
    const id = req.query.id || req.params.id || req.body.id
    const announcement = timeline.announcements.find(value => value._id.equals(id));
    if (!announcement) {
        throw new HttpNotFound("Not found announcement");
    }
    return { timeline, announcement }
}

const findExam = (subject, req) => {
    const timeline = findTimeline(subject, req);
    const id = req.query.idExam || req.params.idExam || req.body.idExam
    const exam = timeline.exams.find(value => value._id.equals(id));
    if (!exam || ((req.user.idPrivilege === PRIVILEGES.STUDENT || req.user.idPrivilege === PRIVILEGES.REGISTER) && exam.isDeleted === true)) {
        throw new HttpNotFound("Not found exam");
    }
    return { timeline, exam };
}

const findQuizBank = (subject, code) => {
    const chapter = subject.quizBank.find(value => value._id.equals(code));
    if (!chapter) {
        throw new HttpNotFound("Not found quiz bank");
    }
    return chapter;
}

const findSurvey = (subject, req) => {
    const timeline = findTimeline(subject, req);
    const id = req.query.idSurvey || req.params.idSurvey || req.body.idSurvey
    const survey = timeline.surveys.find(value => value._id.equals(id));
    if (!survey || ((req.user.idPrivilege === PRIVILEGES.STUDENT || req.user.idPrivilege === PRIVILEGES.REGISTER) && survey.isDeleted === true)) {
        throw new HttpNotFound("Not found survey");
    }
    return { timeline, survey };
}

const findSurveyBank = (subject, code) => {
    const chapter = subject.surveyBank.find(value => value._id.equals(code));
    if (!chapter) {
        throw new HttpNotFound("Not found survey bank");
    }
    return chapter;
}
module.exports = {
    findTimeline,
    findForum,
    findTopic,
    findAssignment,
    findAnnouncement,
    findQuizBank,
    findExam,
    findSurvey,
    findSurveyBank
}