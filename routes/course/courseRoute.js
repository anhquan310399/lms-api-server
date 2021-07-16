const router = require('express').Router();
const {
    authUser,
    authInCourse,
    authTeacherInCourse,
    authStudentInCourse,
    authTeacher,
    authStudent
} = require("../../middlewares/auth");
const { checkSemester } = require('../../middlewares/checkSemester');
const controller = require("../../controllers/user/courseController")
const { catchErrors } = require("../../handlers/errorHandlers");

//Create course by lecture
router.post('/', authTeacher, catchErrors(controller.create));
//Route find all courses
router.get('/', authUser, catchErrors(controller.getAllEnrolledCourses));
//Route get all public course
router.post('/public', authUser, catchErrors(controller.findPublicSubject));

//Route deadline
router.get('/deadline', authStudent, catchErrors(controller.getDeadline));
router.get('/:idCourse/deadline', authStudentInCourse, catchErrors(controller.getDeadlineBySubject));

//Route find course by id
router.get('/:idCourse', authInCourse, catchErrors(controller.getDetail));

//Route exit course
router.get('/:idCourse/exit-requests', authTeacherInCourse, catchErrors(controller.getExitRequests));
router.post('/:idCourse/exit', authStudentInCourse, checkSemester, catchErrors(controller.exitSubject));
router.post('/:idCourse/accept-exit', authTeacherInCourse, checkSemester, catchErrors(controller.acceptExitRequest));
router.post('/:idCourse/deny-exit', authTeacherInCourse, checkSemester, catchErrors(controller.denyExitRequest));

//Route config of course
router.get('/:idCourse/config', authTeacherInCourse, catchErrors(controller.getConfig));
router.put('/:idCourse/config', authTeacherInCourse, checkSemester, catchErrors(controller.updateConfig));

//Route enroll course
router.get('/:idCourse/enroll-requests', authTeacherInCourse, catchErrors(controller.getEnrollRequests));
router.post('/:idCourse/enroll', authStudent, checkSemester, catchErrors(controller.enrollSubject));
router.post('/:idCourse/accept-enroll', authTeacherInCourse, checkSemester, catchErrors(controller.acceptEnrollRequest));
router.post('/:idCourse/deny-enroll', authTeacherInCourse, checkSemester, catchErrors(controller.denyEnrollRequest));

//Route import, export
router.post('/:idCourse/export', authTeacherInCourse, catchErrors(controller.exportQuizBank));
router.post('/:idCourse/import', authTeacherInCourse, catchErrors(controller.importQuizBank));
router.post('/:idCourse/clone', authTeacherInCourse, catchErrors(controller.cloneExistedCourse));
router.get('/:idCourse/clone', authTeacherInCourse, catchErrors(controller.getAllCloneCourse));

//Route list student in course
router.get('/:idCourse/students', authInCourse, catchErrors(controller.getListStudent));
router.post('/:idCourse/add-student', authTeacherInCourse, catchErrors(controller.addStudent));
router.delete('/:idCourse/remove-student/', authTeacherInCourse, catchErrors(controller.removeStudent));
// router.post('/:idCourse/add-list-student', catchErrors(subjectController.addAllStudents));

//Route order timeline
router.get('/:idCourse/index', authTeacherInCourse, catchErrors(controller.getOrderOfTimeLine));
router.post('/:idCourse/index', authTeacherInCourse, catchErrors(controller.adjustOrderOfTimeline));

//Route score
router.get('/:idCourse/score', authInCourse, catchErrors(controller.getSubjectTranscript));
router.get('/:idCourse/transcript', authTeacherInCourse, catchErrors(controller.getSubjectTranscriptTotal));
router.put('/:idCourse/ratio', authTeacherInCourse, catchErrors(controller.updateRatioTranscript));

//Route check zoom
router.get("/:idCourse/zoom", authInCourse, checkSemester, catchErrors(controller.getZoom));

module.exports = router;