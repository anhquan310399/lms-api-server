const router = require('express').Router();
const { authInSubject, authLectureInSubject } = require("../middlewares/auth")
const { catchErrors } = require("../handlers/errorHandlers");
const controller = require("../controllers/user/forumController")
const { checkCourse } = require('../middlewares/checkCourse');

router.get('/', authInSubject, catchErrors(controller.findAll));
router.post('/', checkCourse, authLectureInSubject, catchErrors(controller.create));
router.get('/:idForum', authInSubject, catchErrors(controller.find));
router.get('/:idForum/update', authLectureInSubject, catchErrors(controller.findUpdate));
router.put('/:idForum', checkCourse, authLectureInSubject, catchErrors(controller.update));
router.put('/:idForum/hide', checkCourse, authLectureInSubject, catchErrors(controller.hideOrUnhide));

// router.delete('/:idForum/', authLectureInSubject, forumController.delete);

module.exports = router;