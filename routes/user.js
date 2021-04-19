const router = require("express").Router();
var { authLogin } = require('../middlewares/auth');
const { catchErrors } = require("../handlers/errorHandlers");
const userController = require("../controllers/user/userController");

router.put('/', authLogin, catchErrors(userController.update));
router.post('/register', authLogin, catchErrors(userController.register));
router.get('/info', authLogin, catchErrors(userController.getInfo));
router.put('/password', authLogin, catchErrors(userController.updatePassword));
router.post('/password/forget', catchErrors(userController.requestResetPassword));
router.post('/password/reset', authLogin, catchErrors(userController.resetPassword));
router.post('/authenticate', catchErrors(userController.authenticate));
router.post('/auth/google/', catchErrors(userController.authenticateGoogleToken));
router.post('/auth/facebook/', catchErrors(userController.authenticateFacebookToken));
router.put('/auth/facebook/link', authLogin, catchErrors(userController.linkFacebookAccount));
router.put('/auth/facebook/unlink', authLogin, catchErrors(userController.unlinkFacebookAccount));

module.exports = router;