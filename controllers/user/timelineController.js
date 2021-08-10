const _ = require('lodash');
const { HttpNotFound } = require('../../utils/errors');
const { getDetailTimeline } = require('../../services/DataHelpers');
const { findTimeline, findFile } = require('../../services/FindHelpers');
const { ClientResponsesMessages } = require('../../constants/ResponseMessages');
const { TimelineResponseMessages } = ClientResponsesMessages
const PRIVILEGES = require('../../constants/PrivilegeCode');

exports.create = async (req, res) => {
    const course = req.course;

    const model = {
        name: req.body.data.name,
        description: req.body.data.description,
        index: course.timelines.length + 1
    };

    const length = course.timelines.push(model);

    await course.save();

    res.json({
        success: true,
        message: TimelineResponseMessages.CREATE_SUCCESS,
        timeline: getDetailTimeline(course.timelines[length - 1])
    });
};

exports.findAll = async (req, res) => {
    const course = req.course;

    const timelines = _.sortBy(await Promise.all(course.timelines.map(async (value) => {
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

exports.find = async (req, res) => {
    const course = req.course;

    const timeline = findTimeline(course, req.params.idTimeline, false);

    const data = getDetailTimeline(timeline);

    res.json({
        success: true,
        timeline: data
    });
};

exports.update = async (req, res) => {
    const course = req.course;

    const timeline = findTimeline(course, req.params.idTimeline, false);

    timeline.name = req.body.data.name;
    timeline.description = req.body.data.description;

    await course.save();

    res.json({
        success: true,
        message: TimelineResponseMessages.UPDATE_SUCCESS,
        timeline: getDetailTimeline(timeline)
    });

};

exports.lock = async (req, res) => {
    const course = req.course;

    const timeline = findTimeline(course, req.params.idTimeline, false);

    timeline.isDeleted = !timeline.isDeleted;

    await course.save();

    res.json({
        success: true,
        message: TimelineResponseMessages.LOCK_MESSAGE(timeline),
        timeline: getDetailTimeline(timeline)
    });

};

exports.uploadFile = async (req, res) => {
    const course = req.course;

    const timeline = findTimeline(course, req.params.idTimeline, false);

    const file = {
        name: req.body.data.name,
        path: req.body.data.path,
        type: req.body.data.type,
        isDeleted: req.body.data.isDeleted || false
    }
    const index = timeline.files.push(file);

    await course.save();

    res.json({
        success: true,
        message: TimelineResponseMessages.UPLOAD_FILE_SUCCESS,
        file: timeline.files[index - 1]
    });
}

exports.getFile = async (req, res) => {
    const course = req.course;

    const { file } = findFile(course, req.params.idTimeline, req.params.idFile, !(req.user.idPrivilege === PRIVILEGES.TEACHER))

    res.json({
        success: true,
        file: file
    });
}

exports.updateFile = async (req, res) => {
    const course = req.course;

    const { file } = findFile(course, req.params.idTimeline, req.params.idFile, false);


    file.name = req.body.data.name;
    file.path = req.body.data.path;
    file.type = req.body.data.type;
    if (file.path !== req.body.data.path) { file.uploadDay = new Date(); }
    file.isDeleted = req.body.data.isDeleted || false;

    await course.save();
    res.json({
        success: true,
        file: file
    });

}

exports.removeFile = async (req, res) => {
    const course = req.course;

    const { timeline, file } = findFile(course, req.params.idTimeline, req.params.idFile, false);


    let index = timeline.files.indexOf(file);
    timeline.files.splice(index, 1);
    await course.save();

    res.json({
        success: true,
        message: TimelineResponseMessages.DELETE_FILE_SUCCESS
    });
}