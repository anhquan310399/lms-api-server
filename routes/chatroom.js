const router = require("express").Router();
const { catchErrors } = require("../handlers/errorHandlers");
const controller = require("../controllers/user/chatroomController");
const { authLogin } = require('../middlewares/auth');


router.post("/", authLogin, catchErrors(controller.createChatroom));
router.post("/contact", authLogin, catchErrors(controller.searchNewContact));
router.get("/", authLogin, catchErrors(controller.getAllChatrooms));
router.get("/:idChatroom", authLogin, catchErrors(controller.getChatroom));
router.post("/:idChatroom/messages", authLogin, catchErrors(controller.getMessages));

module.exports = router;