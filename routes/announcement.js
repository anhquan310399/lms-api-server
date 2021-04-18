const router = require('express').Router();
const { authInSubject, authLecture } = require("../middlewares/auth")
const controller = require("../controllers/user/announcementController")
const { catchErrors } = require("../handlers/errorHandlers");

router.get('/', authInSubject, catchErrors(controller.findAll));
router.post('/', authLecture, catchErrors(controller.create));
router.get('/:id', authInSubject, catchErrors(controller.find));
router.put('/:id/', authLecture, catchErrors(controller.update));
router.delete('/:id/', authLecture, catchErrors(controller.delete));

module.exports = router;