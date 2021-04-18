const router = require('express').Router();
const { authLectureInSubject } = require("../middlewares/auth")
const { catchErrors } = require("../handlers/errorHandlers");
const timelineController = require("../controllers/user/timelineController")

router.post('/', authLectureInSubject, catchErrors(timelineController.create));
router.get('/', authLectureInSubject, catchErrors(timelineController.findAll));
router.get('/:idTimeline', authLectureInSubject, catchErrors(timelineController.find));
router.put('/:idTimeline/', authLectureInSubject, catchErrors(timelineController.update));
router.put('/:idTimeline/hide', authLectureInSubject, catchErrors(timelineController.hideOrUnHide));

router.post('/upload', authLectureInSubject, catchErrors(timelineController.uploadFile));
router.delete('/:idTimeline/remove/:idFile', authLectureInSubject, catchErrors(timelineController.removeFile));
router.get('/:idTimeline/files/:idFile', authLectureInSubject, catchErrors(timelineController.getFile));
router.put('/:idTimeline/files/:idFile', authLectureInSubject, catchErrors(timelineController.updateFile));

module.exports = router;