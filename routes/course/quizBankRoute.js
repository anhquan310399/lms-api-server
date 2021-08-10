const router = require('express').Router();
const { authTeacherInCourse } = require("../../middlewares/auth");
const { catchErrors } = require("../../handlers/errorHandlers");
const controller = require("../../controllers/user/quizBankController")
const { checkSemester } = require('../../middlewares/checkSemester');

router.get('/', authTeacherInCourse, catchErrors(controller.findAllChapters));
router.get('/:idChapter', authTeacherInCourse, catchErrors(controller.findChapter));
router.post('/', authTeacherInCourse, catchErrors(controller.createChapter));
router.put('/:idChapter/', authTeacherInCourse, catchErrors(controller.updateChapter));
router.delete('/:idChapter/', authTeacherInCourse, catchErrors(controller.deleteChapter));

module.exports = router;