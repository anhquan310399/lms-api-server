const router = require('express').Router();
const { authInCourse, authTeacherInCourse } = require("../../middlewares/auth")
const controller = require("../controllers/user/announcementController")
const { catchErrors } = require("../../handlers/errorHandlers");
const {  checkSemester } = require('../../middlewares/checkSemester');

router.get('/', authInCourse, catchErrors(controller.findAll));
router.post('/',  authTeacherInCourse, catchErrors(controller.create));
router.get('/:id', authInCourse, catchErrors(controller.find));
router.put('/:id/',  authTeacherInCourse, catchErrors(controller.update));
router.delete('/:id/',  authTeacherInCourse, catchErrors(controller.delete));

module.exports = router;