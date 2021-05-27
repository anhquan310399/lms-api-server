const router = require('express').Router();
const { authTeacherInCourse } = require("../../middlewares/auth")
const { catchErrors } = require("../../handlers/errorHandlers");
const controller = require("../../controllers/user/timelineController")
const { checkSemester } = require('../../middlewares/checkSemester');

router.post('/', authTeacherInCourse, catchErrors(controller.create));
router.get('/', authTeacherInCourse, catchErrors(controller.findAll));
router.get('/:idTimeline', authTeacherInCourse, catchErrors(controller.find));
router.put('/:idTimeline/', authTeacherInCourse, catchErrors(controller.update));
router.put('/:idTimeline/hide', authTeacherInCourse, catchErrors(controller.lock));

router.post('/:idTimeline/upload', authTeacherInCourse, catchErrors(controller.uploadFile));
router.delete('/:idTimeline/remove/:idFile', authTeacherInCourse, catchErrors(controller.removeFile));
router.get('/:idTimeline/files/:idFile', authTeacherInCourse, catchErrors(controller.getFile));
router.put('/:idTimeline/files/:idFile', authTeacherInCourse, catchErrors(controller.updateFile));

module.exports = router;