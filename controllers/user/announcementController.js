const { HttpNotFound } = require('../../utils/errors');
const { getCommonData } = require('../../services/DataMapper');
const { findTimeline, findAnnouncement } = require('../../services/DataSearcher');
exports.create = async(req, res) => {
    const subject = req.subject;
    const timeline = findTimeline(subject, req);
    const announcement = {
        name: req.body.data.name,
        content: req.body.data.content
    };
    const length = timeline.announcements.push(announcement);
    await subject.save();
    res.json({
        success: true,
        message: 'Create new announcement successfully!',
        announcement: getCommonData(timeline.announcements[length - 1])
    });
};

exports.find = async(req, res) => {
    const subject = req.subject;
    const { announcement } = findAnnouncement(subject, req);

    res.json({
        success: true,
        announcement: getCommonData(announcement)
    });

};

exports.findAll = async(req, res) => {
    const subject = req.subject;
    const timeline = findTimeline(subject, req);
    const announcement = await Promise.all(timeline.announcements.map(async(value) => {
        return getCommonData(value);
    }));
    res.json({
        success: true,
        announcement: announcement
    });
};

exports.update = async(req, res) => {
    const subject = req.subject;
    const { announcement } = findAnnouncement(subject, req);

    announcement.name = req.body.data.name;
    announcement.content = req.body.data.content;
    await subject.save();

    res.json({
        success: true,
        message: 'Update announcement successfully!',
        announcement: getCommonData(announcement)
    });
};

exports.delete = async(req, res) => {
    const subject = req.subject;
    const { timeline, announcement } = findAnnouncement(subject, req);
    const index = timeline.announcements.indexOf(announcement);

    timeline.announcements.splice(index, 1);

    await subject.save();
    res.json({
        success: true,
        message: "Delete information successfully!"
    });
};