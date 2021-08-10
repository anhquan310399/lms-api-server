const router = require('express').Router();
const { authInCourse, authTeacherInCourse } = require("../../middlewares/auth")
const { catchErrors } = require("../../handlers/errorHandlers");
const controller = require("../../controllers/user/forumController")
const { checkSemester } = require('../../middlewares/checkSemester');

router.get('/', authInCourse, catchErrors(controller.findAll));
router.post('/', authTeacherInCourse, catchErrors(controller.create));
router.get('/:id', authInCourse, catchErrors(controller.find));
router.get('/:id/update', authTeacherInCourse, catchErrors(controller.findUpdate));
router.put('/:id', authTeacherInCourse, catchErrors(controller.update));
router.put('/:id/hide', authTeacherInCourse, catchErrors(controller.lock));
router.delete('/:id/', authTeacherInCourse, catchErrors(controller.delete));

module.exports = router;