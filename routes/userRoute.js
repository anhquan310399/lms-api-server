const router = require("express").Router();
var { authLogin } = require('../middlewares/auth');
const { catchErrors } = require("../handlers/errorHandlers");
const controller = require("../controllers/user/userController");

router.put('/', authLogin, catchErrors(controller.update));
router.post('/register', catchErrors(controller.register));
router.get('/info', authLogin, catchErrors(controller.getInfo));
router.put('/password', authLogin, catchErrors(controller.updatePassword));
router.post('/password/forget', catchErrors(controller.requestResetPassword));
router.post('/password/reset', authLogin, catchErrors(controller.resetPassword));
router.post('/authenticate', catchErrors(controller.authenticate));
router.post('/auth/google/', catchErrors(controller.authenticateGoogleToken));
router.post('/auth/facebook/', catchErrors(controller.authenticateFacebookToken));
router.put('/auth/facebook/link', authLogin, catchErrors(controller.linkFacebookAccount));
router.put('/auth/facebook/unlink', authLogin, catchErrors(controller.unlinkFacebookAccount));

module.exports = router;