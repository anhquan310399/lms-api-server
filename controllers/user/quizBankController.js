const { HttpNotFound } = require('../../utils/errors');
const { getInfoQuestionBank } = require('../../services/DataHelpers');
const { ClientResponsesMessages } = require('../../constants/ResponseMessages');
const { QuizBankResponseMessages } = ClientResponsesMessages

exports.createChapter = async (req, res) => {
    const course = req.course;

    const model = {
        name: req.body.data.name,
        questions: req.body.data.questions,
    };

    const length = course.quizBank.push(model);

    await course.save();
    res.json({
        success: true,
        chapter: getInfoQuestionBank(course.quizBank[length - 1])
    });

};

exports.findChapter = async (req, res) => {
    const course = req.course;

    const chapter = course.quizBank.find(chapter => chapter._id.equals(req.params.idChapter));

    if (!chapter) {
        throw new HttpNotFound(QuizBankResponseMessages.NOT_FOUND_CHAPTER);
    }

    res.json({
        success: true,
        chapter
    });
};

exports.findAllChapters = async (req, res) => {
    const course = req.course;

    const quizBank = await Promise.all(course.quizBank.map(async (chapter) => {
        return getInfoQuestionBank(chapter);
    }));

    res.json({
        success: true,
        quizBank
    });
};

exports.updateChapter = async (req, res) => {
    const course = req.course;

    const chapter = course.quizBank.find(value => value._id.equals(req.params.idChapter));

    if (!chapter) {
        throw new HttpNotFound(QuizBankResponseMessages.NOT_FOUND_CHAPTER);
    }

    const data = req.body.data;

    chapter.name = data.name
    chapter.questions = data.questions;

    await course.save();

    res.json({
        success: true,
        message: QuizBankResponseMessages.UPDATE_CHAPTER_SUCCESS
    });
};

exports.deleteChapter = async (req, res) => {
    const course = req.course;
    const chapter = course.quizBank.find(chapter => chapter._id.equals(req.params.idChapter));

    if (!chapter) {
        throw new HttpNotFound(QuizBankResponseMessages.NOT_FOUND_CHAPTER);
    }

    const index = course.quizBank.indexOf(chapter);

    course.quizBank.splice(index, 1);

    await course.save();

    res.json({
        success: true,
        message: QuizBankResponseMessages.DELETE_CHAPTER_SUCCESS
    });
};