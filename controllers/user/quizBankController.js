const { HttpNotFound } = require('../../utils/errors');
const { getInfoQuestionBank } = require('../../services/DataMapper')
exports.createChapter = async(req, res) => {
    const subject = req.subject;
    const model = {
        name: req.body.data.name,
        questions: req.body.data.questions,
    };
    const length = subject.quizBank.push(model);
    await subject.save()
    res.json({
        success: true,
        chapter: getInfoQuestionBank(subject.quizBank[length - 1])
    });

};

exports.findChapter = async(req, res) => {
    const subject = req.subject;
    const chapter = subject.quizBank.find(value => value._id == req.params.idChapter);
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
    const quizBank = await Promise.all(subject.quizBank.map(async(value) => {
        return getInfoQuestionBank(value);
    }));
    res.json({
        success: true,
        quizBank
    });
};

exports.updateChapter = async(req, res) => {
    const subject = req.subject;
    const chapter = subject.quizBank.find(value => value._id == req.params.idChapter);
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
    const chapter = subject.quizBank.find(value => value._id == req.params.idChapter);
    if (!chapter) {
        throw new HttpNotFound("Not found questionnaire");
    }

    const index = subject.quizBank.indexOf(chapter);
    subject.quizBank.splice(index, 1);
    await subject.save()
    res.json({
        success: true,
        message: "Delete Successfully!"
    });
};