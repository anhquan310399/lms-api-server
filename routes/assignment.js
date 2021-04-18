const router = require('express').Router();
const controller = require("../controllers/user/assignmentController");
const { authInSubject, authLectureInSubject, authStudentInSubject } = require('../middlewares/auth');
const { catchErrors } = require("../handlers/errorHandlers");
/** forum */
router.get('/:idAssignment', authInSubject, catchErrors(controller.find));
router.get('/:idAssignment/update', authLectureInSubject, catchErrors(controller.findUpdate));
router.get('/', authInSubject, catchErrors(controller.findAll));
router.post('/', authLectureInSubject, catchErrors(controller.create));
router.post('/:idAssignment/submit', authStudentInSubject, catchErrors(controller.submit));
router.post('/:idAssignment/grade/:idSubmission', authLectureInSubject, catchErrors(controller.gradeSubmission));
router.post('/:idAssignment/comment/:idSubmission', authInSubject, catchErrors(controller.commentFeedback));
router.put('/:idAssignment', authLectureInSubject, catchErrors(controller.update));
// router.delete('/:idAssignment', authLectureInSubject, assignmentController.delete);
router.put('/:idAssignment/hide', authLectureInSubject, catchErrors(controller.hideOrUnhide));

module.exports = router;