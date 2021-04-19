const { HttpNotFound } = require('../../utils/errors');
const { getInfoQuestionBank } = require('../../services/DataMapper')
exports.createChapter = async(req, res) => {
    const subject = req.subject;
    const model = {
        name: req.body.data.name,
        questions: req.body.data.questions,
    };
    const length = subject.surveyBank.push(model);
    await subject.save()
    res.json({
        success: true,
        chapter: getInfoQuestionBank(subject.surveyBank[length - 1])
    });

};

exports.findChapter = async(req, res) => {
    const subject = req.subject;
    const chapter = subject.surveyBank.find(value => value._id.equals(req.params.idChapter));
    if (!chapter) {
        throw new HttpNotFound("Not found questionnaire");
    }
    res.json({
        success: true,
        chapter
    });
};

exports.findAllChapters = async(req, res) => {
    const subject = req.subject;
    const surveyBank = await Promise.all(subject.surveyBank.map(async(value) => {
        return getInfoQuestionBank(value);
    }));
    res.json({
        success: true,
        surveyBank
    });
};

exports.updateChapter = async(req, res) => {
    const subject = req.subject;
    const chapter = subject.surveyBank.find(value => value._id.equals(req.params.idChapter));
    if (!chapter) {
        throw new HttpNotFound("Not found questionnaire");
    }

    chapter.name = req.body.data.name || chapter.name;
    chapter.questions = req.body.data.questions || chapter.questions;

    await subject.save()

    res.json({
        success: true,
        message: 'Update chapter successfully!'
    });
};

exports.deleteChapter = async(req, res) => {
    const subject = req.subject;
    const chapter = subject.surveyBank.find(value => value._id.equals(req.params.idChapter));
    if (!chapter) {
        throw new HttpNotFound("Not found questionnaire");
    }

    const index = subject.surveyBank.indexOf(chapter);
    subject.surveyBank.splice(index, 1);
    await subject.save()
    res.json({
        success: true,
        message: "Delete Successfully!"
    });
};