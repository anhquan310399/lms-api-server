const router = require('express').Router();
const controller = require("../controllers/user/examController");
const { authInSubject, authLecture, authStudent } = require("../middlewares/auth")
const { catchErrors } = require("../handlers/errorHandlers");
/** forum */
router.get('/', authInSubject, catchErrors(controller.findAll));
router.post('/', authLecture, catchErrors(controller.create));
router.get('/:idExam', authInSubject, catchErrors(controller.find));
router.get('/:idExam/update', authLecture, catchErrors(controller.findUpdate));
router.put('/:idExam', authLecture, catchErrors(controller.update));
// router.delete('/:idExam', authLecture, examController.delete);
router.put('/:idExam/hide', authLecture, catchErrors(controller.hideOrUnhide));
router.get('/:idExam/attempt', authStudent, catchErrors(controller.attemptExam));
router.get('/:idExam/attempt/:idSubmission', authStudent, catchErrors(controller.doExam));
router.post('/:idExam/submit/:idSubmission', authStudent, catchErrors(controller.submitExam));

module.exports = router;