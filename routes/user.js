const router = require("express").Router();
var { authLogin } = require('../middlewares/auth');
const { catchErrors } = require("../handlers/errorHandlers");
const userController = require("../controllers/user/userController");

router.get('/info', authLogin, catchErrors(userController.getInfo));
router.put('/', authLogin, catchErrors(userController.update));
router.put('/password', authLogin, catchErrors(userController.updatePassword));
router.post('/authenticate', catchErrors(userController.authenticate));
router.post('/auth/google/', catchErrors(userController.authenticateGoogleToken));
router.post('/auth/facebook/', catchErrors(userController.authenticateFacebookToken));
router.put('/auth/facebook/link', authLogin, catchErrors(userController.linkFacebookAccount));
router.put('/auth/facebook/unlink', authLogin, catchErrors(userController.unlinkFacebookAccount));

module.exports = router;