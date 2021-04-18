const router = require("express").Router();
const { catchErrors } = require("../handlers/errorHandlers");
const controller = require("../controllers/courseController");
const { authAdmin } = require("../middlewares/auth")

router.post("/", authAdmin, catchErrors(controller.create));
router.get("/", authAdmin, catchErrors(controller.findAll));
router.get("/:id", authAdmin, catchErrors(controller.findById));
router.put("/:id", authAdmin, catchErrors(controller.update));
router.delete("/:id", authAdmin, catchErrors(controller.delete));
module.exports = router;