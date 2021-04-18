const router = require('express').Router();
const {
    authUser,
    authInSubject,
    authLectureInSubject,
    authStudentInSubject,
    authLecture,
    authStudent
} = require("../middlewares/auth")
const controller = require("../controllers/user/subjectController")
const { catchErrors } = require("../handlers/errorHandlers");

//Create subject by lecture
router.post('/', authLecture, catchErrors(controller.create));
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
router.post('/:idSubject/exit', authStudentInSubject, catchErrors(controller.exitSubject));
router.post('/:idSubject/accept-exit', authLectureInSubject, catchErrors(controller.acceptExitRequest));
router.post('/:idSubject/deny-exit', authLectureInSubject, catchErrors(controller.denyExitRequest));

//Route config of subject
router.get('/:idSubject/config', authLectureInSubject, catchErrors(controller.getConfig));
router.put('/:idSubject/config', authLectureInSubject, catchErrors(controller.updateConfig));

//Route enroll subject
router.get('/:idSubject/enroll-requests', authLectureInSubject, catchErrors(controller.getEnrollRequests));
router.post('/:idSubject/enroll', authStudent, catchErrors(controller.enrollSubject));
router.post('/:idSubject/accept-enroll', authLectureInSubject, catchErrors(controller.acceptEnrollRequest));
router.post('/:idSubject/deny-enroll', authLectureInSubject, catchErrors(controller.denyEnrollRequest));

//Route import, export
router.post('/:idSubject/export', authLectureInSubject, catchErrors(controller.exportSubjectWithCondition));
router.post('/:idSubject/import', authLectureInSubject, catchErrors(controller.importSubject));

//Route list student in subject
router.get('/:idSubject/students', authInSubject, catchErrors(controller.getListStudent));
router.post('/:idSubject/add-student', authLectureInSubject, catchErrors(controller.addStudent));
router.delete('/:idSubject/remove-student/', authLectureInSubject, catchErrors(controller.removeStudent));
// router.post('/:idSubject/add-list-student', catchErrors(subjectController.addAllStudents));

//Route order timeline
router.get('/:idSubject/index', authLectureInSubject, catchErrors(controller.getOrderOfTimeLine));
router.post('/:idSubject/index', authLectureInSubject, catchErrors(controller.adjustOrderOfTimeline));

//Route score
router.get('/:idSubject/score', authInSubject, catchErrors(controller.getSubjectTranscript));
router.get('/:idSubject/transcript', authLectureInSubject, catchErrors(controller.getSubjectTranscriptTotal));
router.put('/:idSubject/ratio', authLectureInSubject, catchErrors(controller.updateRatioTranscript));

//Route check zoom
router.get("/:idSubject/zoom", authInSubject, catchErrors(controller.getZoom));

module.exports = router;