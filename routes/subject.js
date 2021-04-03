const router = require('express').Router();
const { authLogin, authInSubject, authLecture, authAdmin, authStudent } = require("../middlewares/auth")
const subjectController = require("../controllers/subjectController")
const { catchErrors } = require("../handlers/errorHandlers");

router.get('/', authLogin, catchErrors(subjectController.findAll));
router.get('/deadline', authStudent, catchErrors(subjectController.getDeadline));
router.get('/:idSubject/deadline', authStudent, catchErrors(subjectController.getDeadlineBySubject));
router.get('/:idSubject', authInSubject, catchErrors(subjectController.find));
router.get('/:idSubject/detail', authAdmin, catchErrors(subjectController.findByAdmin));
router.get('/:idSubject/export', authAdmin, catchErrors(subjectController.exportSubject));
router.post('/:idSubject/export-teacher', authLecture, catchErrors(subjectController.exportSubjectWithCondition));
router.post('/:idSubject/import-teacher', authLecture, catchErrors(subjectController.importSubject));
router.post('/', authAdmin, catchErrors(subjectController.create));
router.put('/:idSubject/', authAdmin, catchErrors(subjectController.update));
router.put('/:idSubject/hide', authAdmin, catchErrors(subjectController.hideOrUnhide));

router.get('/:idSubject/students', authInSubject, catchErrors(subjectController.getListStudent));
router.post('/:idSubject/add-student', authLecture, catchErrors(subjectController.addStudent));
router.delete('/:idSubject/remove-student/', authLecture, catchErrors(subjectController.removeStudent));

router.delete('/:idSubject/', authAdmin, catchErrors(subjectController.delete));
// router.post('/:idSubject/add-list-student', catchErrors(subjectController.addAllStudents));

router.get('/:idSubject/index', authLecture, catchErrors(subjectController.getOrderOfTimeLine));
router.post('/:idSubject/index', authLecture, catchErrors(subjectController.adjustOrderOfTimeline));


router.get('/:idSubject/score', authInSubject, catchErrors(subjectController.getSubjectTranscript));
router.get('/:idSubject/transcript', authLecture, catchErrors(subjectController.getSubjectTranscriptTotal));

router.put('/:idSubject/ratio', authLecture, catchErrors(subjectController.updateRatioTranscript));


module.exports = router;