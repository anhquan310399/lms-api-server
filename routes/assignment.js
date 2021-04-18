const router = require('express').Router();
const controller = require("../controllers/user/assignmentController");
const { authInSubject, authLecture, authStudent } = require('../middlewares/auth');
const { catchErrors } = require("../handlers/errorHandlers");
/** forum */
router.get('/:idAssignment', authInSubject, catchErrors(controller.find));
router.get('/:idAssignment/update', authLecture, catchErrors(controller.findUpdate));
router.get('/', authInSubject, catchErrors(controller.findAll));
router.post('/', authLecture, catchErrors(controller.create));
router.post('/:idAssignment/submit', authStudent, catchErrors(controller.submit));
router.post('/:idAssignment/grade/:idSubmission', authLecture, catchErrors(controller.gradeSubmission));
router.post('/:idAssignment/comment/:idSubmission', authInSubject, catchErrors(controller.commentFeedback));
router.put('/:idAssignment', authLecture, catchErrors(controller.update));
// router.delete('/:idAssignment', authLecture, assignmentController.delete);
router.put('/:idAssignment/hide', authLecture, catchErrors(controller.hideOrUnhide));

module.exports = router;