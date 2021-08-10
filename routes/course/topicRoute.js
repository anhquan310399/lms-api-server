const router = require('express').Router();
const { authInCourse } = require("../../middlewares/auth")
const { catchErrors } = require("../../handlers/errorHandlers");
const controller = require("../../controllers/user/topicController")
const { checkSemester } = require('../../middlewares/checkSemester');

router.post('/', authInCourse, checkSemester, catchErrors(controller.create));
router.get('/:idTopic', authInCourse, checkSemester, catchErrors(controller.find));
router.put('/:idTopic', authInCourse, checkSemester, catchErrors(controller.update));
router.delete('/:idTopic', authInCourse, checkSemester, catchErrors(controller.delete));

router.post('/:idTopic/discuss', authInCourse, checkSemester, catchErrors(controller.discuss));
router.put('/:idTopic/discuss/:idDiscussion', checkSemester, authInCourse, catchErrors(controller.updateDiscussion));
router.delete('/:idTopic/discuss/:idDiscussion', checkSemester, authInCourse, catchErrors(controller.deleteDiscussion));

module.exports = router;