const router = require('express').Router();
const controller = require("../../controllers/user/examController");
const { authInCourse, authTeacherInCourse, authStudentInCourse } = require("../../middlewares/auth")
const { catchErrors } = require("../../handlers/errorHandlers");
const { checkSemester } = require('../../middlewares/checkSemester');

router.get('/', authInCourse, catchErrors(controller.findAll));
router.post('/', authTeacherInCourse, catchErrors(controller.create));
router.get('/:id', authInCourse, catchErrors(controller.find));
router.get('/:id/update', authTeacherInCourse, catchErrors(controller.findUpdate));
router.put('/:id', authTeacherInCourse, catchErrors(controller.update));
router.delete('/:id', authTeacherInCourse, catchErrors(controller.delete));
router.put('/:id/hide', authTeacherInCourse, catchErrors(controller.lock));
router.get('/:id/attempt', authStudentInCourse, checkSemester, catchErrors(controller.attemptExam));
router.get('/:id/attempt/:idSubmission', authStudentInCourse, checkSemester, catchErrors(controller.doExam));
router.post('/:id/submit/:idSubmission', authStudentInCourse, checkSemester, catchErrors(controller.submitExam));

module.exports = router;