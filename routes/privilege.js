const router = require("express").Router();
const { catchErrors } = require("../handlers/errorHandlers");
const privilegeController = require("../controllers/privilegeController");
const { authAdmin } = require("../middlewares/auth")

router.post("/", authAdmin, catchErrors(privilegeController.create));
router.get("/", authAdmin, catchErrors(privilegeController.findAll));
router.get("/:role", authAdmin, catchErrors(privilegeController.findByRole));
router.put("/:id", authAdmin, catchErrors(privilegeController.update));
router.delete("/:id", authAdmin, catchErrors(privilegeController.delete));
module.exports = router;