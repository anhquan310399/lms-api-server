const router = require("express").Router();
const { catchErrors } = require("../../handlers/errorHandlers");
const semesterCTL = require("../../controllers/admin/semesterController");
const courseCTL = require("../../controllers/admin/courseController");
const privilegeCTL = require("../../controllers/admin/privilegeController");
const userCTL = require("../../controllers/admin/userController");
const facultyCTL = require("../../controllers/admin/facultyController");
const adminCTL = require("../../controllers/admin/adminController");

const { authAdmin } = require("../../middlewares/auth")

router.get("/statistic", authAdmin, catchErrors(adminCTL.getStatistic));

/**
 * Route for faculty controller
 */
router.post("/faculty", authAdmin, catchErrors(facultyCTL.create));
router.get("/faculty", authAdmin, catchErrors(facultyCTL.findAll));
router.put("/faculty/:id", authAdmin, catchErrors(facultyCTL.update));
router.delete("/faculty", authAdmin, catchErrors(facultyCTL.delete));
router.put("/faculty/:id/lock", authAdmin, catchErrors(facultyCTL.lock));

/**
 * Route for semester controller
 */
router.post("/semester", authAdmin, catchErrors(semesterCTL.create));
router.post("/semester/filter", authAdmin, catchErrors(semesterCTL.filter));
router.get("/semester", authAdmin, catchErrors(semesterCTL.findAll));
router.get("/semester/:id", authAdmin, catchErrors(semesterCTL.findById));
router.put("/semester/:id", authAdmin, catchErrors(semesterCTL.update));
router.put("/semester/:id/force", authAdmin, catchErrors(semesterCTL.setCurrent));

/**
 * Route for course controller
 */
router.post('/course/filter', authAdmin, catchErrors(courseCTL.filterSubjects));
router.get('/course', authAdmin, catchErrors(courseCTL.findAll));
router.post('/course', authAdmin, catchErrors(courseCTL.create));
router.put('/course/:id', authAdmin, catchErrors(courseCTL.update));
router.put('/course/:id/hide', authAdmin, catchErrors(courseCTL.lock));
router.delete('/course/:id', authAdmin, catchErrors(courseCTL.delete));
router.get('/course/:id', authAdmin, catchErrors(courseCTL.find));

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
router.get('/user/teacher', authAdmin, catchErrors(userCTL.findAllTeachers));
router.post('/user/teacher', authAdmin, catchErrors(userCTL.filterTeachers));
router.post('/user/student', authAdmin, catchErrors(userCTL.filterStudents));
router.post('/user/register', authAdmin, catchErrors(userCTL.filterRegisters));
router.get('/user/:code', authAdmin, catchErrors(userCTL.findUser));
router.get('/user/', authAdmin, catchErrors(userCTL.findAll));
router.post('/user/', authAdmin, catchErrors(userCTL.create));
router.put('/user/:id/lock', authAdmin, catchErrors(userCTL.lockUser));

module.exports = router;