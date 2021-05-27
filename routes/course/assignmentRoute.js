const router = require('express').Router();
const controller = require("../../controllers/user/assignmentController");
const { authInCourse, authTeacherInCourse, authStudentInCourse } = require('../../middlewares/auth');
const { catchErrors } = require("../../handlers/errorHandlers");
const { checkSemester } = require('../../middlewares/checkSemester');

router.get('/', authInCourse, catchErrors(controller.findAll));
router.post('/', authTeacherInCourse, catchErrors(controller.create));
router.get('/:id', authInCourse, catchErrors(controller.find));
router.get('/:id/update', authTeacherInCourse, catchErrors(controller.findUpdate));
router.post('/:id/submit', authStudentInCourse, checkSemester, catchErrors(controller.submit));
router.post('/:id/grade/:idSubmission', authTeacherInCourse, catchErrors(controller.gradeSubmission));
router.post('/:id/comment/:idSubmission', authInCourse, checkSemester, catchErrors(controller.commentFeedback));
router.put('/:id', authTeacherInCourse, catchErrors(controller.update));
router.delete('/:id', authLectureInSubject, catchErrors(controller.delete));
router.put('/:id/hide', authTeacherInCourse, catchErrors(controller.lock));

module.exports = router;