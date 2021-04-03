const router = require('express').Router();
const { authInSubject } = require("../middlewares/auth")
const { catchErrors } = require("../handlers/errorHandlers");
const controller = require("../controllers/topicController")

router.post('/', authInSubject, catchErrors(controller.create));
router.get('/:idTopic', authInSubject, catchErrors(controller.find));

module.exports = router;