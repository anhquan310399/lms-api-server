const router = require('express').Router();
const { authLecture } = require("../middlewares/auth")
const { catchErrors } = require("../handlers/errorHandlers");
const timelineController = require("../controllers/user/timelineController")

router.post('/', authLecture, catchErrors(timelineController.create));
router.get('/', authLecture, catchErrors(timelineController.findAll));
router.get('/:idTimeline', authLecture, catchErrors(timelineController.find));
router.put('/:idTimeline/', authLecture, catchErrors(timelineController.update));
router.put('/:idTimeline/hide', authLecture, catchErrors(timelineController.hideOrUnHide));

router.post('/upload', authLecture, catchErrors(timelineController.uploadFile));
router.delete('/:idTimeline/remove/:idFile', authLecture, catchErrors(timelineController.removeFile));
router.get('/:idTimeline/files/:idFile', authLecture, catchErrors(timelineController.getFile));
router.put('/:idTimeline/files/:idFile', authLecture, catchErrors(timelineController.updateFile));

module.exports = router;