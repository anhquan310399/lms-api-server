const router = require("express").Router();
const { catchErrors } = require("../../handlers/errorHandlers");
const semesterCTL = require("../../controllers/admin/semesterController");
const courseCTL = require("../../controllers/admin/courseController");
const privilegeCTL = require("../../controllers/admin/privilegeController");
const userCTL = require("../../controllers/admin/userController");
const facultyCTL = require("../../controllers/admin/facultyController");
const adminCTL = require("../../controllers/admin/adminController");
const curriculumCTL = require("../../controllers/admin/curriculumController");
const subjectCTL = require("../../controllers/admin/subjectController");
const classCTL = require("../../controllers/admin/classController");


const { authAdmin } = require("../../middlewares/auth")

router.get("/statistic", authAdmin, catchErrors(adminCTL.getStatistic));

/**
 * Route for curriculum controller
 */

router.post("/curriculum/:id/subjects", authAdmin, catchErrors(curriculumCTL.addSubjects));
router.put("/curriculum/:id/subjects", authAdmin, catchErrors(curriculumCTL.updateSubjects));
router.get("/curriculum/:id/subjects", authAdmin, catchErrors(curriculumCTL.getAllSubjects));
router.post("/curriculum/filter", authAdmin, catchErrors(curriculumCTL.filter));
router.post("/curriculum", authAdmin, catchErrors(curriculumCTL.create));
router.get("/curriculum", authAdmin, catchErrors(curriculumCTL.findAll));
router.put("/curriculum/:id", authAdmin, catchErrors(curriculumCTL.update));
router.delete("/curriculum/:id", authAdmin, catchErrors(curriculumCTL.delete));

/**
 * Route for subject controller
 */

router.post("/subject/filter", authAdmin, catchErrors(subjectCTL.filter));
router.post("/subject", authAdmin, catchErrors(subjectCTL.create));
router.get("/subject", authAdmin, catchErrors(subjectCTL.findAll));
router.put("/subject/:id", authAdmin, catchErrors(subjectCTL.update));
router.delete("/subject/:id", authAdmin, catchErrors(subjectCTL.delete));
router.put("/subject/:id/lock", authAdmin, catchErrors(subjectCTL.lock));

/**
 * Route for class controller
 */

router.post("/class/filter", authAdmin, catchErrors(classCTL.filter));
router.post("/class", authAdmin, catchErrors(classCTL.create));
router.get("/class/:id/students", authAdmin, catchErrors(classCTL.getAllStudents));
router.post("/class/:id/students", authAdmin, catchErrors(classCTL.addStudents));
router.put("/class/:id/students", authAdmin, catchErrors(classCTL.updateStudents));
router.get("/class", authAdmin, catchErrors(classCTL.findAll));
router.put("/class/:id", authAdmin, catchErrors(classCTL.update));
router.delete("/class/:id", authAdmin, catchErrors(classCTL.delete));

/**
 * Route for faculty controller
 */
router.post("/faculty", authAdmin, catchErrors(facultyCTL.create));
router.post("/faculty/filter", authAdmin, catchErrors(facultyCTL.filter));
router.get("/faculty", authAdmin, catchErrors(facultyCTL.findAll));
router.put("/faculty/:id", authAdmin, catchErrors(facultyCTL.update));
router.delete("/faculty/:id", authAdmin, catchErrors(facultyCTL.delete));
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
router.post('/course/filter', authAdmin, catchErrors(courseCTL.filter));
router.get('/course', authAdmin, catchErrors(courseCTL.findAll));
router.post('/course', authAdmin, catchErrors(courseCTL.create));
router.put('/course/:id', authAdmin, catchErrors(courseCTL.update));
router.put('/course/:id/lock', authAdmin, catchErrors(courseCTL.lock));
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