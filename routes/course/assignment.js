const router = require('express').Router();
const controller = require("../controllers/user/assignmentController");
const { authInSubject, authLectureInSubject, authStudentInSubject } = require('../middlewares/auth');
const { catchErrors } = require("../handlers/errorHandlers");
const { checkCourse } = require('../middlewares/checkCourse');

router.get('/', authInSubject, catchErrors(controller.findAll));
router.post('/', checkCourse, authLectureInSubject, catchErrors(controller.create));
router.get('/:idAssignment', authInSubject, catchErrors(controller.find));
router.get('/:idAssignment/update', authLectureInSubject, catchErrors(controller.findUpdate));
router.post('/:idAssignment/submit', checkCourse, authStudentInSubject, catchErrors(controller.submit));
router.post('/:idAssignment/grade/:idSubmission', checkCourse, authLectureInSubject, catchErrors(controller.gradeSubmission));
router.post('/:idAssignment/comment/:idSubmission', checkCourse, authInSubject, catchErrors(controller.commentFeedback));
router.put('/:idAssignment', checkCourse, authLectureInSubject, catchErrors(controller.update));
// router.delete('/:idAssignment', authLectureInSubject, assignmentController.delete);
router.put('/:idAssignment/hide', checkCourse, authLectureInSubject, catchErrors(controller.hideOrUnhide));

module.exports = router;