const router = require("express").Router();
const { catchErrors } = require("../handlers/errorHandlers");
const courseCTL = require("../controllers/admin/courseController");
const subjectCTL = require("../controllers/admin/subjectController");
const privilegeCTL = require("../controllers/admin/privilegeController");
const userCTL = require("../controllers/admin/userController");
const adminCTL = require("../controllers/admin/adminController");

const { authAdmin } = require("../middlewares/auth")

router.get("/statistic", authAdmin, catchErrors(adminCTL.getStatistic));

/**
 * Route for course controller
 */
router.post("/course", authAdmin, catchErrors(courseCTL.create));
router.post("/course/filter", authAdmin, catchErrors(courseCTL.filterCourses));
router.get("/course", authAdmin, catchErrors(courseCTL.findAll));
router.get("/course/:id", authAdmin, catchErrors(courseCTL.findById));
router.put("/course/:id", authAdmin, catchErrors(courseCTL.update));
router.put("/course/:id/force", authAdmin, catchErrors(courseCTL.setCurrentCourse));

/**
 * Route for subject controller
 */
router.get('/subject/statistic', authAdmin, catchErrors(subjectCTL.getStatistic));
router.post('/subject/filter', authAdmin, catchErrors(subjectCTL.filterSubjects));
router.get('/subject', authAdmin, catchErrors(subjectCTL.findAll));
router.post('/subject', authAdmin, catchErrors(subjectCTL.create));
router.put('/subject/:idSubject', authAdmin, catchErrors(subjectCTL.update));
router.put('/subject/:idSubject/hide', authAdmin, catchErrors(subjectCTL.hideOrUnhide));
router.delete('/subject/:idSubject', authAdmin, catchErrors(subjectCTL.delete));
router.get('/subject/:idSubject', authAdmin, catchErrors(subjectCTL.find));

/**
 * Route for privilege controller
 */
router.post("/privilege", authAdmin, catchErrors(privilegeCTL.create));
router.get("/privilege", authAdmin, catchErrors(privilegeCTL.findAll));
router.get("/privilege/:role", authAdmin, catchErrors(privilegeCTL.findByRole));
router.put("/privilege/:id", authAdmin, catchErrors(privilegeCTL.update));
router.delete("/privilege/:id", authAdmin, catchErrors(privilegeCTL.delete));

/**
 * Route for user controller
 */
router.get('/user/statistic', authAdmin, catchErrors(userCTL.getStatistics));
router.get('/user/teacher', authAdmin, catchErrors(userCTL.findAllTeachers));
router.post('/user/teacher', authAdmin, catchErrors(userCTL.filterTeachers));
router.post('/user/student', authAdmin, catchErrors(userCTL.filterStudents));
router.post('/user/register', authAdmin, catchErrors(userCTL.filterRegisters));
router.get('/user/:code', authAdmin, catchErrors(userCTL.findUser));
router.get('/user/', authAdmin, catchErrors(userCTL.findAll));
router.post('/user/', authAdmin, catchErrors(userCTL.create));
router.put('/user/:id/lock', authAdmin, catchErrors(userCTL.lockUser));

module.exports = router;