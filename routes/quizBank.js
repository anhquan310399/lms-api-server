const router = require('express').Router();
const { authLectureInSubject } = require("../middlewares/auth");
const { catchErrors } = require("../handlers/errorHandlers");
const controller = require("../controllers/user/quizBankController")

router.get('/', authLectureInSubject, catchErrors(controller.findAllChapters));
router.get('/:idChapter', authLectureInSubject, catchErrors(controller.findChapter));
router.post('/', authLectureInSubject, catchErrors(controller.createChapter));
router.put('/:idChapter/', authLectureInSubject, catchErrors(controller.updateChapter));
router.delete('/:idChapter/', authLectureInSubject, catchErrors(controller.deleteChapter));

module.exports = router;