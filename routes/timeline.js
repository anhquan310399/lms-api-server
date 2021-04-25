const router = require('express').Router();
const { authLectureInSubject } = require("../middlewares/auth")
const { catchErrors } = require("../handlers/errorHandlers");
const timelineController = require("../controllers/user/timelineController")
const { checkCourse } = require('../middlewares/checkCourse');

router.post('/', checkCourse, authLectureInSubject, catchErrors(timelineController.create));
router.get('/', authLectureInSubject, catchErrors(timelineController.findAll));
router.get('/:idTimeline', authLectureInSubject, catchErrors(timelineController.find));
router.put('/:idTimeline/', checkCourse, authLectureInSubject, catchErrors(timelineController.update));
router.put('/:idTimeline/hide', checkCourse, authLectureInSubject, catchErrors(timelineController.hideOrUnHide));

router.post('/:idTimeline/upload', checkCourse, authLectureInSubject, catchErrors(timelineController.uploadFile));
router.delete('/:idTimeline/remove/:idFile', checkCourse, authLectureInSubject, catchErrors(timelineController.removeFile));
router.get('/:idTimeline/files/:idFile', authLectureInSubject, catchErrors(timelineController.getFile));
router.put('/:idTimeline/files/:idFile', checkCourse, authLectureInSubject, catchErrors(timelineController.updateFile));

module.exports = router;