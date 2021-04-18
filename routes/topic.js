const router = require('express').Router();
const { authInSubject } = require("../middlewares/auth")
const { catchErrors } = require("../handlers/errorHandlers");
const controller = require("../controllers/user/topicController")

router.post('/', authInSubject, catchErrors(controller.create));
router.get('/:idTopic', authInSubject, catchErrors(controller.find));
router.put('/:idTopic', authInSubject, catchErrors(controller.update));
router.delete('/:idTopic', authInSubject, catchErrors(controller.delete));

router.post('/:idTopic/discuss', authInSubject, catchErrors(controller.discuss));
router.put('/:idTopic/discuss/:idDiscussion', authInSubject, catchErrors(controller.updateDiscussion));
router.delete('/:idTopic/discuss/:idDiscussion', authInSubject, catchErrors(controller.deleteDiscussion));

module.exports = router;