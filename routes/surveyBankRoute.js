const router = require('express').Router();
const { authTeacher } = require("../middlewares/auth");
const { catchErrors } = require("../handlers/errorHandlers");
const controller = require("../controllers/user/surveyBankController")

router.get('/', authTeacher, catchErrors(controller.find));

module.exports = router;