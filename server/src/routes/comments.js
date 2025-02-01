const router = require('express').Router();
const CommentController = require('../controllers/commentController');
const { isAuth, isCoordinator, isAdmin } = require('../middleware/auth');
const { checkSubscription } = require('../middleware/checkSubscription');


router.post('/', isAuth, checkSubscription, CommentController.create);
router.get('/:prayerId', isAuth, checkSubscription,  CommentController.getCommentsByPrayer);
router.get('/checkSubscription', isAuth, checkSubscription);
router.delete('/:id', isAuth, checkSubscription,  CommentController.delete);



module.exports = router;