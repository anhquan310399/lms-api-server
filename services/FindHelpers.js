const { HttpNotFound } = require('../utils/errors');

const Messages = {
    NOT_FOUND_TIMELINE: 'Not found timeline',
    NOT_FOUND_FORUM: 'Not found forum',
    NOT_FOUND_TOPIC: 'Not found topic',
    NOT_FOUND_ASSIGNMENT: 'Not found assignment',
    NOT_FOUND_ANNOUNCEMENT: 'Not found announcement',
    NOT_FOUND_EXAM: 'Not found exam',
    NOT_FOUND_SURVEY: 'Not found survey',
    NOT_FOUND_FILE: 'Not found file',
    NOT_FOUND_QUIZ_BANK: 'Not found quiz bank'
}

const findTimeline = (course, idTimeline, isStudent) => {
    const timeline = course.timelines.find(value => value._id.equals(idTimeline));
    if (!timeline ||
        (isStudent && timeline.isDeleted === true)) {
        throw new HttpNotFound(Messages.NOT_FOUND_TIMELINE);
    }
    return timeline;
}

const findForum = (course, idTimeline, idForum, isStudent) => {
    const timeline = findTimeline(course, idTimeline, isStudent);
    const forum = timeline.forums.find(value => value._id.equals(idForum));
    if (!forum || (isStudent && forum.isDeleted === true)) {
        throw new HttpNotFound(Messages.NOT_FOUND_FORUM);
    }
    return { timeline, forum }
}

const findTopic = (course, idTimeline, idForum, idTopic, isStudent) => {
    const { timeline, forum } = findForum(course, idTimeline, idForum, isStudent);
    const topic = forum.topics.find(value => value._id.equals(idTopic))
    if (!topic) {
        throw new HttpNotFound(Messages.NOT_FOUND_TOPIC);
    }
    return { timeline, forum, topic };
}

const findAssignment = (course, idTimeline, idAssignment, isStudent) => {
    const timeline = findTimeline(course, idTimeline, isStudent);
    const assignment = timeline.assignments.find(value => value._id.equals(idAssignment));
    if (!assignment || (isStudent && assignment.isDeleted === true)) {
        throw new HttpNotFound(Messages.NOT_FOUND_ASSIGNMENT);
    }
    return { timeline, assignment };
}

const findAnnouncement = (course, idTimeline, idAnnouncement, isStudent) => {
    const timeline = findTimeline(course, idTimeline, isStudent);
    const announcement = timeline.announcements.find(value => value._id.equals(idAnnouncement));
    if (!announcement) {
        throw new HttpNotFound(Messages.NOT_FOUND_ANNOUNCEMENT);
    }
    return { timeline, announcement }
}

const findExam = (course, idTimeline, idExam, isStudent) => {
    const timeline = findTimeline(course, idTimeline, isStudent);
    const exam = timeline.exams.find(value => value._id.equals(idExam));
    if (!exam || (isStudent && exam.isDeleted === true)) {
        throw new HttpNotFound(Messages.NOT_FOUND_EXAM);
    }
    return { timeline, exam };
}

const findSurvey = (course, idTimeline, idSurvey, isStudent) => {
    const timeline = findTimeline(course, idTimeline, isStudent);
    const survey = timeline.surveys.find(value => value._id.equals(idSurvey));
    if (!survey || (isStudent && survey.isDeleted === true)) {
        throw new HttpNotFound(Messages.NOT_FOUND_SURVEY);
    }
    return { timeline, survey };
}

const findFile = (course, idTimeline, idFile, isStudent) => {
    const timeline = findTimeline(course, idTimeline, isStudent);
    const file = timeline.files.find(value => value._id.equals(idFile));
    if (!file || (isStudent && file.isDeleted === true)) {
        throw new HttpNotFound(Messages.NOT_FOUND_SURVEY);
    }
    return { timeline, file };
}
const findChapterOfQuizBank = (course, chapterId) => {
    const chapter = course.quizBank.find(value => value._id.equals(chapterId));
    if (!chapter) {
        throw new HttpNotFound(Messages.NOT_FOUND_QUIZ_BANK);
    }
    return chapter;
}
module.exports = {
    findTimeline,
    findForum,
    findTopic,
    findAssignment,
    findAnnouncement,
    findExam,
    findSurvey,
    findFile,
    findChapterOfQuizBank
}