const router = require('express').Router();
const controller = require('../controllers/user/surveyController');
const { authInSubject, authLectureInSubject, authStudentInSubject } = require("../middlewares/auth")
const { catchErrors } = require("../handlers/errorHandlers");
const { checkCourse } = require('../middlewares/checkCourse');

router.post('/', checkCourse, authLectureInSubject, catchErrors(controller.create));
router.get('/', authLectureInSubject, catchErrors(controller.findAll));
router.get('/:idSurvey', authInSubject, catchErrors(controller.find));
router.get('/:idSurvey/update', authLectureInSubject, catchErrors(controller.findUpdate));
router.put('/:idSurvey', checkCourse, authLectureInSubject, catchErrors(controller.update));
router.put('/:idSurvey/hide', checkCourse, authLectureInSubject, catchErrors(controller.hideOrUnhide));
router.delete('/:idSurvey/', checkCourse, authLectureInSubject, catchErrors(controller.delete));

router.get('/:idSurvey/attempt', authStudentInSubject, catchErrors(controller.attemptSurvey));
router.post('/:idSurvey/submit', checkCourse, authStudentInSubject, catchErrors(controller.replySurvey));
router.get('/:idSurvey/view', authStudentInSubject, catchErrors(controller.viewResponse));
router.get('/:idSurvey/responses', authInSubject, catchErrors(controller.viewAllResponse));

module.exports = router