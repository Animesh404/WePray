const router = require('express').Router();
const MessageController = require('../controllers/messageController');
const { isAuth, isCoordinator, isAdmin } = require('../middleware/auth');
const { checkSubscription } = require('../middleware/checkSubscription');


router.post('/', isAuth, checkSubscription, MessageController.create);
router.get('/:prayerId', isAuth, checkSubscription,  MessageController.getMessagesByPrayer);
router.get('/received/:userId', isAuth, checkSubscription, MessageController.getMessagesForUser);
router.get('/sent/:userId', isAuth, checkSubscription, MessageController.getMessagesByUser);
router.get('/checkSubscription', isAuth, checkSubscription);
router.delete('/:id', isAuth, checkSubscription,  MessageController.delete);



module.exports = router;