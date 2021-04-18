const router = require("express").Router();
const { catchErrors } = require("../handlers/errorHandlers");
const controller = require("../controllers/user/chatroomController");
const { authLogin } = require('../middlewares/auth');


router.post("/", authLogin, catchErrors(controller.createChatroom));
router.get("/", authLogin, catchErrors(controller.getAllChatrooms));
router.get("/:idChatroom", authLogin, catchErrors(controller.getChatroom));

module.exports = router;