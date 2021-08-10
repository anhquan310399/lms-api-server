const router = require('express').Router();
const controller = require('../../controllers/user/surveyController');
const { authInCourse, authTeacherInCourse, authStudentInCourse } = require("../../middlewares/auth")
const { catchErrors } = require("../../handlers/errorHandlers");
const { checkSemester } = require('../../middlewares/checkSemester');

router.post('/', authTeacherInCourse, catchErrors(controller.create));
router.get('/', authTeacherInCourse, catchErrors(controller.findAll));
router.get('/:id', authInCourse, catchErrors(controller.find));
router.get('/:id/update', authTeacherInCourse, catchErrors(controller.findUpdate));
router.put('/:id', authTeacherInCourse, catchErrors(controller.update));
router.put('/:id/hide', authTeacherInCourse, catchErrors(controller.hideOrUnhide));
router.delete('/:id/', authTeacherInCourse, catchErrors(controller.delete));

router.get('/:id/attempt', authStudentInCourse, checkSemester, catchErrors(controller.attemptSurvey));
router.post('/:id/submit', authStudentInCourse, checkSemester, catchErrors(controller.replySurvey));
router.get('/:id/view', authStudentInCourse, catchErrors(controller.viewResponse));
router.get('/:id/responses', authInCourse, catchErrors(controller.viewAllResponse));

module.exports = router