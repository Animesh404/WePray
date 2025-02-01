const SubscriptionModel = require('../models/SubscriptionModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class SubscriptionController {
  static async createCheckoutSession(req, res) {
    try {
      const { priceId } = req.body;
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
        metadata: { userId: req.user.id },
        customer_email: req.user.email
      });
      res.json({ sessionId: session.id });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      await SubscriptionModel.handleWebhook(event);
      res.json({ received: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getStatus(req, res) {
    try {
      const subscription = await SubscriptionModel.checkSubscriptionAccess(req.user.id);
    //   console.log("subscribed user", subscription);
      res.json({
        subscription
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getSubStatus(req, res) {
    try {
      const subscription = await SubscriptionModel.getSubscriptionStatus(req.user.id);
    //   console.log("subscribed user", subscription);
      res.json({
        subscription
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async cancelSubscription(req, res) {
    try {
      await SubscriptionModel.cancelSubscription(req.user.id);
      res.json({ message: 'Subscription cancelled successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getAllPlans(req, res) {
    try {
      const plans = await SubscriptionModel.getAllPlans();
      res.json(plans);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async createPlan(req, res) {
    try {
      const planId = await SubscriptionModel.createPlan(req.body);
      res.status(201).json({ id: planId });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updatePlan(req, res) {
    try {
      const success = await SubscriptionModel.updatePlan(req.params.id, req.body);
      if (!success) {
        return res.status(404).json({ error: 'Plan not found' });
      }
      res.json({ message: 'Plan updated successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deletePlan(req, res) {
    try {
      const success = await SubscriptionModel.deletePlan(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Plan not found' });
      }
      res.json({ message: 'Plan deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Test subscription methods
  static async createTestSubscription(req, res) {
    try {
      const existingSub = await SubscriptionModel.checkSubscriptionAccess(req.user.id);
      if (existingSub) {
        return res.status(400).json({ error: 'Active subscription exists' });
      }

      const [testPlan] = await pool.query(
        'SELECT id FROM subscription_plans WHERE is_test = true LIMIT 1'
      );

      let planId;
      if (!testPlan.length) {
        planId = await SubscriptionModel.createPlan({
          name: 'Test Plan',
          price: 0,
          duration_months: 1,
          features: ['Comments', 'Premium Support'],
          is_test: true
        }, false);
      } else {
        planId = testPlan.id;
      }

      const subscription = await SubscriptionModel.createSubscription(
        req.user.id,
        planId
      );
      res.status(201).json(subscription);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async extendTestSubscription(req, res) {
    try {
      const { months = 1 } = req.body;
      await SubscriptionModel.extendTestSubscription(req.user.id, months);
      res.json({ message: 'Test subscription extended' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async cancelTestSubscription(req, res) {
    try {
      await SubscriptionModel.cancelSubscription(req.user.id, true);
      res.json({ message: 'Test subscription cancelled' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = SubscriptionController;