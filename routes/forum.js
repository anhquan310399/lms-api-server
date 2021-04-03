const router = require('express').Router();
const { authInSubject, authLecture } = require("../middlewares/auth")
const { catchErrors } = require("../handlers/errorHandlers");
const controller = require("../controllers/forumController")

/** forum */
router.get('/', authInSubject, catchErrors(controller.findAll));
router.post('/', authLecture, catchErrors(controller.create));
router.get('/:idForum', authInSubject, catchErrors(controller.find));
router.get('/:idForum/update', authLecture, catchErrors(controller.findUpdate));
router.put('/:idForum', authLecture, catchErrors(controller.update));
router.put('/:idForum/hide', authLecture, catchErrors(controller.hideOrUnhide));

// router.delete('/:idForum/', authLecture, forumController.delete);

module.exports = router;