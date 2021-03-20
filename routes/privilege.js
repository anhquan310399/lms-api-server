const router = require("express").Router();
const { catchErrors } = require("../handlers/errorHandlers");
const privilegeController = require("../controllers/privilegeController");

router.post("/", catchErrors(privilegeController.create));
router.get("/", catchErrors(privilegeController.findAll));
router.get("/:role", catchErrors(privilegeController.findByRole));
router.put("/:id", catchErrors(privilegeController.update));
router.delete("/:id", catchErrors(privilegeController.delete));
module.exports = router;