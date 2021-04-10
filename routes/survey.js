const router = require('express').Router();
const controller = require('../controllers/surveyController');
const { authInSubject, authLecture, authStudent } = require("../middlewares/auth")
const { catchErrors } = require("../handlers/errorHandlers");

router.post('/', authLecture, catchErrors(controller.create));
router.get('/', authLecture, catchErrors(controller.findAll));
router.get('/:idSurvey', authInSubject, catchErrors(controller.find));
router.get('/:idSurvey/update', authLecture, catchErrors(controller.findUpdate));
router.put('/:idSurvey', authLecture, catchErrors(controller.update));
router.put('/:idSurvey/hide', authLecture, catchErrors(controller.hideOrUnhide));
router.delete('/:idSurvey/', authLecture, catchErrors(controller.delete));

router.get('/:idSurvey/attempt', authStudent, catchErrors(controller.attemptSurvey));
router.post('/:idSurvey/submit', authStudent, catchErrors(controller.replySurvey));
router.get('/:idSurvey/view', authStudent, catchErrors(controller.viewResponse));
router.get('/:idSurvey/responses', authInSubject, catchErrors(controller.viewAllResponse));

module.exports = router