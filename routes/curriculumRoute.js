const router = require('express').Router();
const { authLogin } = require("../middlewares/auth");
const { catchErrors } = require("../handlers/errorHandlers");
const controller = require("../controllers/user/curriculumController");

router.get('/', authLogin, catchErrors(controller.findAll));

router.get('/:id/subjects', authLogin, catchErrors(controller.getAllSubjects));

module.exports = router;
