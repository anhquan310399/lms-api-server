const router = require('express').Router();
const { authLecture } = require("../middlewares/auth");
const { catchErrors } = require("../handlers/errorHandlers");
const controller = require("../controllers/quizBankController")

router.get('/', authLecture, catchErrors(controller.findAllChapters));
router.get('/:idChapter', authLecture, catchErrors(controller.findChapter));
router.post('/', authLecture, catchErrors(controller.createChapter));
router.put('/:idChapter/', authLecture, catchErrors(controller.updateChapter));
router.delete('/:idChapter/', authLecture, catchErrors(controller.deleteChapter));

module.exports = router;