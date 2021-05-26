const router = require('express').Router();
const { authInSubject, authLectureInSubject } = require("../middlewares/auth")
const controller = require("../controllers/user/announcementController")
const { catchErrors } = require("../handlers/errorHandlers");
const { checkCourse } = require('../middlewares/checkCourse');

router.get('/', authInSubject, catchErrors(controller.findAll));
router.post('/', checkCourse, authLectureInSubject, catchErrors(controller.create));
router.get('/:id', authInSubject, catchErrors(controller.find));
router.put('/:id/', checkCourse, authLectureInSubject, catchErrors(controller.update));
router.delete('/:id/', checkCourse, authLectureInSubject, catchErrors(controller.delete));

module.exports = router;