const router = require("express").Router();
const { catchErrors } = require("../handlers/errorHandlers");
const courseCTL = require("../controllers/admin/courseController");
const subjectCTL = require("../controllers/admin/subjectController");
const privilegeCTL = require("../controllers/admin/privilegeController");
const userCTL = require("../controllers/admin/userController");

const { authAdmin } = require("../middlewares/auth")

/**
 * Route for course controller
 */
router.post("/course", authAdmin, catchErrors(courseCTL.create));
router.get("/course", authAdmin, catchErrors(courseCTL.findAll));
router.get("/course/:id", authAdmin, catchErrors(courseCTL.findById));
router.put("/course/:id", authAdmin, catchErrors(courseCTL.update));
router.delete("/course/:id", authAdmin, catchErrors(courseCTL.delete));

/**
 * Route for subject controller
 */
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
router.get('/user/teachers', authAdmin, catchErrors(userCTL.findAllTeachers));
router.get('/user/students', authAdmin, catchErrors(userCTL.findAllStudents));
router.get('/user/:code', authAdmin, catchErrors(userCTL.findUser));
router.get('/user/', authAdmin, catchErrors(userCTL.findAll));
router.post('/user/', authAdmin, catchErrors(userCTL.create));
router.put('/user/:id/hide', authAdmin, catchErrors(userCTL.hideOrUnhide));

module.exports = router;