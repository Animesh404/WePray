const router = require('express').Router();
const SubscriptionController = require('../controllers/subscriptionController');
const { isAuth, isAdmin } = require('../middleware/auth');
const SubscriptionModel = require('../models/SubscriptionModel');

// Stripe routes
router.post('/create-checkout', isAuth, SubscriptionController.createCheckoutSession);
router.post('/webhook',   require('express').raw({type: 'application/json'}),SubscriptionController.handleWebhook);
router.post('/sync-stripe-plans', async (req, res) => {
    try {
        await SubscriptionModel.syncStripePlans();
        res.json({ message: 'Plans synced successfully' });
    } catch (error) {
        console.error('Error syncing plans:', error);
        res.status(500).json({ error: error.message });
    }
});
router.post('/pause-subscription', isAuth, async (req, res) => {
    try {
      const result = await SubscriptionModel.pauseSubscription(req.user.id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ 
        error: true, 
        message: error.message 
      });
    }
  });
  
  router.post('/resume-subscription', isAuth, async (req, res) => {
    try {
      const result = await SubscriptionModel.resumeSubscription(req.user.id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ 
        error: true, 
        message: error.message 
      });
    }
  });
router.get('/status', isAuth, SubscriptionController.getStatus);
router.get('/subStatus', isAuth, SubscriptionController.getSubStatus);
router.post('/cancel', isAuth, SubscriptionController.cancelSubscription);
// router.get('/is')

// Plan management (admin only)
router.get('/plans', SubscriptionController.getAllPlans);
router.post('/plans', isAuth, isAdmin, SubscriptionController.createPlan);
router.put('/plans/:id', isAuth, isAdmin, SubscriptionController.updatePlan);
router.delete('/plans/:id', isAuth, isAdmin, SubscriptionController.deletePlan);

// Test routes
router.post('/test/subscribe', isAuth, SubscriptionController.createTestSubscription);
router.post('/test/extend', isAuth, SubscriptionController.extendTestSubscription);
router.post('/test/cancel', isAuth, SubscriptionController.cancelTestSubscription);
router.post('/sync-plans', isAuth, async (req, res) => {
    try {
      await SubscriptionModel.syncStripePlans();
      res.json({ message: 'Plans synced successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;