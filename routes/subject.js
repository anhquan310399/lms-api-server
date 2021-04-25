const router = require('express').Router();
const {
    authUser,
    authInSubject,
    authLectureInSubject,
    authStudentInSubject,
    authLecture,
    authStudent
} = require("../middlewares/auth");
const { checkCourse } = require('../middlewares/checkCourse');
const controller = require("../controllers/user/subjectController")
const { catchErrors } = require("../handlers/errorHandlers");

//Create subject by lecture
router.post('/', checkCourse, authLecture, catchErrors(controller.create));
//Route find all subjects
router.get('/', authUser, catchErrors(controller.findAll));
//Route get all public subject
router.get('/public', authUser, catchErrors(controller.findAllPublicSubject));

//Route deadline
router.get('/deadline', authStudent, catchErrors(controller.getDeadline));
router.get('/:idSubject/deadline', authStudentInSubject, catchErrors(controller.getDeadlineBySubject));

//Route find subject by id
router.get('/:idSubject', authInSubject, catchErrors(controller.find));

//Route exit subject
router.get('/:idSubject/exit-requests', authLectureInSubject, catchErrors(controller.getExitRequests));
router.post('/:idSubject/exit', checkCourse, authStudentInSubject, catchErrors(controller.exitSubject));
router.post('/:idSubject/accept-exit', checkCourse, authLectureInSubject, catchErrors(controller.acceptExitRequest));
router.post('/:idSubject/deny-exit', checkCourse, authLectureInSubject, catchErrors(controller.denyExitRequest));

//Route config of subject
router.get('/:idSubject/config', authLectureInSubject, catchErrors(controller.getConfig));
router.put('/:idSubject/config', checkCourse, authLectureInSubject, catchErrors(controller.updateConfig));

//Route enroll subject
router.get('/:idSubject/enroll-requests', authLectureInSubject, catchErrors(controller.getEnrollRequests));
router.post('/:idSubject/enroll', checkCourse, authStudent, catchErrors(controller.enrollSubject));
router.post('/:idSubject/accept-enroll', checkCourse, authLectureInSubject, catchErrors(controller.acceptEnrollRequest));
router.post('/:idSubject/deny-enroll', checkCourse, authLectureInSubject, catchErrors(controller.denyEnrollRequest));

//Route import, export
router.post('/:idSubject/export', authLectureInSubject, catchErrors(controller.exportSubjectWithCondition));
router.post('/:idSubject/import', checkCourse, authLectureInSubject, catchErrors(controller.importSubject));

//Route list student in subject
router.get('/:idSubject/students', authInSubject, catchErrors(controller.getListStudent));
router.post('/:idSubject/add-student', checkCourse, authLectureInSubject, catchErrors(controller.addStudent));
router.delete('/:idSubject/remove-student/', checkCourse, authLectureInSubject, catchErrors(controller.removeStudent));
// router.post('/:idSubject/add-list-student', catchErrors(subjectController.addAllStudents));

//Route order timeline
router.get('/:idSubject/index', authLectureInSubject, catchErrors(controller.getOrderOfTimeLine));
router.post('/:idSubject/index', checkCourse, authLectureInSubject, catchErrors(controller.adjustOrderOfTimeline));

//Route score
router.get('/:idSubject/score', authInSubject, catchErrors(controller.getSubjectTranscript));
router.get('/:idSubject/transcript', authLectureInSubject, catchErrors(controller.getSubjectTranscriptTotal));
router.put('/:idSubject/ratio', checkCourse, authLectureInSubject, catchErrors(controller.updateRatioTranscript));

//Route check zoom
router.get("/:idSubject/zoom", checkCourse, authInSubject, catchErrors(controller.getZoom));

module.exports = router;