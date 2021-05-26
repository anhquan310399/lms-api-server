const router = require('express').Router();
const { authLectureInSubject } = require("../middlewares/auth");
const { catchErrors } = require("../handlers/errorHandlers");
const controller = require("../controllers/user/quizBankController")
const { checkCourse } = require('../middlewares/checkCourse');

router.get('/', authLectureInSubject, catchErrors(controller.findAllChapters));
router.get('/:idChapter', authLectureInSubject, catchErrors(controller.findChapter));
router.post('/', checkCourse, authLectureInSubject, catchErrors(controller.createChapter));
router.put('/:idChapter/', checkCourse, authLectureInSubject, catchErrors(controller.updateChapter));
router.delete('/:idChapter/', checkCourse, authLectureInSubject, catchErrors(controller.deleteChapter));

module.exports = router;