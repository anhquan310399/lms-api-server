const router = require("express").Router();
const { catchErrors } = require("../handlers/errorHandlers");
const controller = require("../controllers/zoomController");
const { authInSubject } = require('../middlewares/auth');

router.get("/:idSubject", authInSubject, catchErrors(controller.getZoom));

module.exports = router;