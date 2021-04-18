const router = require('express').Router();
const { authUser, authInSubject, authLecture, authStudent } = require("../middlewares/auth")
const subjectController = require("../controllers/user/subjectController")
const { catchErrors } = require("../handlers/errorHandlers");

router.get('/', authUser, catchErrors(subjectController.findAll));
router.get('/deadline', authStudent, catchErrors(subjectController.getDeadline));
router.get('/:idSubject/deadline', authStudent, catchErrors(subjectController.getDeadlineBySubject));
router.get('/:idSubject', authInSubject, catchErrors(subjectController.find));
router.post('/:idSubject/export', authLecture, catchErrors(subjectController.exportSubjectWithCondition));
router.post('/:idSubject/import', authLecture, catchErrors(subjectController.importSubject));

router.get('/:idSubject/students', authInSubject, catchErrors(subjectController.getListStudent));
router.post('/:idSubject/add-student', authLecture, catchErrors(subjectController.addStudent));
router.delete('/:idSubject/remove-student/', authLecture, catchErrors(subjectController.removeStudent));

// router.post('/:idSubject/add-list-student', catchErrors(subjectController.addAllStudents));

router.get('/:idSubject/index', authLecture, catchErrors(subjectController.getOrderOfTimeLine));
router.post('/:idSubject/index', authLecture, catchErrors(subjectController.adjustOrderOfTimeline));


router.get('/:idSubject/score', authInSubject, catchErrors(subjectController.getSubjectTranscript));
router.get('/:idSubject/transcript', authLecture, catchErrors(subjectController.getSubjectTranscriptTotal));

router.put('/:idSubject/ratio', authLecture, catchErrors(subjectController.updateRatioTranscript));


module.exports = router;