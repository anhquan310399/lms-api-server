const router = require('express').Router();
const { authInSubject } = require("../middlewares/auth")
const { catchErrors } = require("../handlers/errorHandlers");
const controller = require("../controllers/user/topicController")
const { checkCourse } = require('../middlewares/checkCourse');

router.post('/', checkCourse, authInSubject, catchErrors(controller.create));
router.get('/:idTopic', authInSubject, catchErrors(controller.find));
router.put('/:idTopic', checkCourse, authInSubject, catchErrors(controller.update));
router.delete('/:idTopic', checkCourse, authInSubject, catchErrors(controller.delete));

router.post('/:idTopic/discuss', checkCourse, authInSubject, catchErrors(controller.discuss));
router.put('/:idTopic/discuss/:idDiscussion', checkCourse, authInSubject, catchErrors(controller.updateDiscussion));
router.delete('/:idTopic/discuss/:idDiscussion', checkCourse, authInSubject, catchErrors(controller.deleteDiscussion));

module.exports = router;