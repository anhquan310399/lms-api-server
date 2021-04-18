const _ = require('lodash');
const { HttpNotFound } = require('../../utils/errors');
const { getDetailTimeline } = require('../../services/DataMapper');
const { findTimeline } = require('../../services/DataSearcher');

exports.create = async(req, res) => {
    const subject = req.subject;

    const model = {
        name: req.body.data.name,
        description: req.body.data.description,
        index: subject.timelines.length + 1
    };

    const length = subject.timelines.push(model);

    await subject.save();

    res.json({
        success: true,
        message: "Create timeline successfully!",
        timeline: getDetailTimeline(subject.timelines[length - 1])
    });
};

exports.findAll = async(req, res) => {
    const subject = req.subject;

    const timelines = _.sortBy(await Promise.all(subject.timelines.map(async(value) => {
        return {
            _id: value._id,
            name: value.name,
            description: value.description,
            isDeleted: value.isDeleted,
            index: value.index
        };
    })), ['index']);
    res.json({
        success: true,
        timelines
    });
};

exports.find = async(req, res) => {
    const subject = req.subject;
    const timeline = findTimeline(subject, req);
    const data = getDetailTimeline(timeline);
    res.json({
        success: true,
        timeline: data
    });
};

exports.update = async(req, res) => {
    const subject = req.subject;
    const timeline = findTimeline(subject, req);

    timeline.name = req.body.data.name;
    timeline.description = req.body.data.description;

    await subject.save();

    res.json({
        success: true,
        message: 'Update timeline successfully!',
        timeline: getDetailTimeline(timeline)
    });

};

exports.hideOrUnHide = async(req, res) => {
    const subject = req.subject;
    const timeline = findTimeline(subject, req);
    timeline.isDeleted = !timeline.isDeleted;
    await subject.save();
    let message = "";
    if (timeline.isDeleted) {
        message = `Hide timeline ${timeline.name} successfully!`;
    } else {
        message = `Unhide timeline ${timeline.name} successfully!`;
    }
    res.json({
        success: true,
        message,
        timeline: getDetailTimeline(timeline)
    });

};

exports.uploadFile = async(req, res) => {
    const subject = req.subject;
    const timeline = findTimeline(subject, req);
    const file = {
        name: req.body.data.name,
        path: req.body.data.path,
        type: req.body.data.type,
        uploadDay: new Date(),
        isDeleted: req.body.data.isDeleted || false
    }
    const index = timeline.files.push(file);

    await subject.save();

    res.json({
        success: true,
        message: 'Upload file successfully!',
        file: timeline.files[index - 1]
    });
}

exports.getFile = async(req, res) => {
    const subject = req.subject;
    const timeline = findTimeline(subject, req);
    const file = timeline.files.find(value => value._id == req.params.idFile);
    if (!file) {
        throw new HttpNotFound("Not found file");
    }
    res.json({
        success: true,
        file: file
    });
}

exports.updateFile = async(req, res) => {
    const subject = req.subject;
    const timeline = findTimeline(subject, req);
    const file = timeline.files.find(value => value._id == req.params.idFile);
    if (!file) {
        throw new HttpNotFound("Not found file");
    }
    file.name = req.body.data.name;
    file.path = req.body.data.path;
    file.type = req.body.data.type;
    if (file.path !== req.body.data.path) { file.uploadDay = new Date(); }
    file.isDeleted = req.body.data.isDeleted || false;

    await subject.save();
    res.json({
        success: true,
        file: file
    });

}

exports.removeFile = async(req, res) => {
    const subject = req.subject;
    const timeline = findTimeline(subject, req);
    const file = timeline.files.find(value => value._id == req.params.idFile);
    if (!file) {
        throw new HttpNotFound("Not found file");
    }
    let index = timeline.files.indexOf(file);
    timeline.files.splice(index, 1);
    await subject.save();

    res.json({
        success: true,
        message: "Delete file successfully!"
    });
}