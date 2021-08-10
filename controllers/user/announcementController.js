const { getCommonInfo } = require('../../services/DataHelpers');
const { findTimeline, findAnnouncement } = require('../../services/FindHelpers');
const { ClientResponsesMessages } = require('../../constants/ResponseMessages');
const { AnnounceResponseMessages } = ClientResponsesMessages

exports.create = async (req, res) => {
    const course = req.course;
    const timeline = findTimeline(course, req.body.idTimeline);
    const announcement = {
        name: req.body.data.name,
        content: req.body.data.content
    };
    const length = timeline.announcements.push(announcement);
    await course.save();
    res.json({
        success: true,
        message: AnnounceResponseMessages.CREATE_SUCCESS,
        announcement: getCommonInfo(timeline.announcements[length - 1])
    });
};

exports.find = async (req, res) => {
    const course = req.course;
    const { announcement } = findAnnouncement(course, req.query.idTimeline, req.params.id);

    res.json({
        success: true,
        announcement: getCommonInfo(announcement)
    });

};

exports.findAll = async (req, res) => {
    const course = req.course;
    const timeline = findTimeline(course, req.query.idTimeline);
    const announcement = await Promise.all(timeline.announcements.map(async (value) => {
        return getCommonInfo(value);
    }));
    res.json({
        success: true,
        announcement: announcement
    });
};

exports.update = async (req, res) => {
    const course = req.course;
    const { announcement } = findAnnouncement(course, req.body.idTimeline, req.params.id);

    announcement.name = req.body.data.name;
    announcement.content = req.body.data.content;
    await course.save();

    res.json({
        success: true,
        message: AnnounceResponseMessages.UPDATE_SUCCESS,
        announcement: getCommonInfo(announcement)
    });
};

exports.delete = async (req, res) => {
    const course = req.course;
    const { timeline, announcement } = findAnnouncement(course, req.query.idTimeline, req.params.id);
    const index = timeline.announcements.indexOf(announcement);

    timeline.announcements.splice(index, 1);

    await course.save();
    res.json({
        success: true,
        message: AnnounceResponseMessages.DELETE_SUCCESS
    });
};