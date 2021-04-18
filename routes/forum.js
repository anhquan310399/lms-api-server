const router = require('express').Router();
const { authInSubject, authLectureInSubject } = require("../middlewares/auth")
const { catchErrors } = require("../handlers/errorHandlers");
const controller = require("../controllers/user/forumController")

/** forum */
router.get('/', authInSubject, catchErrors(controller.findAll));
router.post('/', authLectureInSubject, catchErrors(controller.create));
router.get('/:idForum', authInSubject, catchErrors(controller.find));
router.get('/:idForum/update', authLectureInSubject, catchErrors(controller.findUpdate));
router.put('/:idForum', authLectureInSubject, catchErrors(controller.update));
router.put('/:idForum/hide', authLectureInSubject, catchErrors(controller.hideOrUnhide));

// router.delete('/:idForum/', authLectureInSubject, forumController.delete);

module.exports = router;