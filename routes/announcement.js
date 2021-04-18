const router = require('express').Router();
const { authInSubject, authLectureInSubject } = require("../middlewares/auth")
const controller = require("../controllers/user/announcementController")
const { catchErrors } = require("../handlers/errorHandlers");

router.get('/', authInSubject, catchErrors(controller.findAll));
router.post('/', authLectureInSubject, catchErrors(controller.create));
router.get('/:id', authInSubject, catchErrors(controller.find));
router.put('/:id/', authLectureInSubject, catchErrors(controller.update));
router.delete('/:id/', authLectureInSubject, catchErrors(controller.delete));

module.exports = router;