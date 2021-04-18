const router = require('express').Router();
const controller = require("../controllers/user/examController");
const { authInSubject, authLectureInSubject, authStudentInSubject } = require("../middlewares/auth")
const { catchErrors } = require("../handlers/errorHandlers");
/** forum */
router.get('/', authInSubject, catchErrors(controller.findAll));
router.post('/', authLectureInSubject, catchErrors(controller.create));
router.get('/:idExam', authInSubject, catchErrors(controller.find));
router.get('/:idExam/update', authLectureInSubject, catchErrors(controller.findUpdate));
router.put('/:idExam', authLectureInSubject, catchErrors(controller.update));
// router.delete('/:idExam', authLectureInSubject, examController.delete);
router.put('/:idExam/hide', authLectureInSubject, catchErrors(controller.hideOrUnhide));
router.get('/:idExam/attempt', authStudentInSubject, catchErrors(controller.attemptExam));
router.get('/:idExam/attempt/:idSubmission', authStudentInSubject, catchErrors(controller.doExam));
router.post('/:idExam/submit/:idSubmission', authStudentInSubject, catchErrors(controller.submitExam));

module.exports = router;