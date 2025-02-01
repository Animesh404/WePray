const pool = require("../config/database");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

class SubscriptionModel {
  static async createSchema() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS subscription_plans (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        stripe_price_id VARCHAR(255),
        price DECIMAL(10,2) NOT NULL,
        duration_months INT NOT NULL,
        features JSON,
        is_test BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS user_subscriptions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        plan_id INT,
        stripe_subscription_id VARCHAR(255),
        status ENUM('active', 'canceled', 'past_due') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
      )`,
    ];

    for (const query of queries) {
      await pool.query(query);
    }
  }

static async autoCancelExpiredPastDueSubscriptions() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Find all past_due subscriptions that have expired
    const [pastDueSubscriptions] = await connection.query(
      `SELECT us.*, sp.name as plan_name 
       FROM user_subscriptions us
       LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.status = 'past_due'
       AND us.expires_at <= NOW()`
    );

    for (const subscription of pastDueSubscriptions) {
      if (subscription.stripe_subscription_id) {
        try {
          // Cancel in Stripe
          await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
        } catch (stripeError) {
          console.error(`Failed to cancel Stripe subscription ${subscription.stripe_subscription_id}:`, stripeError);
          // Continue with local cancellation even if Stripe fails
        }
      }

      // Update local database
      await connection.query(
        `UPDATE user_subscriptions 
         SET status = 'canceled'
         WHERE id = ?`,
        [subscription.id]
      );

      console.log(`Auto-canceled past due subscription ${subscription.id} for user ${subscription.user_id}`);
    }

    await connection.commit();
    return pastDueSubscriptions.length;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

  static async createPlan(planData, syncWithStripe = true) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let stripePriceId = planData.stripe_price_id;

      if (syncWithStripe && !planData.is_test) {
        const stripeProduct = await stripe.products.create({
          name: planData.name,
          metadata: { features: JSON.stringify(planData.features) },
        });

        const stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: Math.round(planData.price * 100),
          currency: "usd",
          recurring: {
            interval: planData.duration_months === 1 ? "month" : "year",
            interval_count: planData.duration_months === 1 ? 1 : 1,
          },
        });

        stripePriceId = stripePrice.id;
      }

      const [result] = await connection.query(
        `INSERT INTO subscription_plans 
         (name, stripe_price_id, price, duration_months, features, is_test) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          planData.name,
          stripePriceId,
          planData.price,
          planData.duration_months,
          JSON.stringify(planData.features),
          !!planData.is_test,
        ]
      );

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async createCheckoutSession(userId, priceId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get user details
      const [user] = await connection.query(
        "SELECT email FROM users WHERE id = ?",
        [userId]
      );

      if (!user.length) throw new Error("User not found");

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
       
        customer_email: user[0].email,
        metadata: { userId },
        success_url: `${process.env.FRONTEND_URL}/dashboard`,
        cancel_url: `${process.env.FRONTEND_URL}/#subscription`,
      });

      await connection.commit();
      return session;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async createSubscription(userId, planId) {
    const connection = await pool.getConnection();
    try {
      await connection.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
      await connection.beginTransaction();

      const [plan] = await connection.query(
        "SELECT * FROM subscription_plans WHERE id = ?",
        [planId]
      );

      if (!plan.length) throw new Error("Plan not found");

      const [user] = await connection.query(
        "SELECT email FROM users WHERE id = ?",
        [userId]
      );

      if (!user.length) throw new Error("User not found");

      let stripeSubscriptionId = null;
      const expirationDate = new Date();
      expirationDate.setMonth(
        expirationDate.getMonth() + plan[0].duration_months
      );

      if (!plan[0].is_test) {
        const customer = await stripe.customers.create({
          email: user[0].email,
          metadata: { user_id: userId },
        });

        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: plan[0].stripe_price_id }],
          metadata: {
            user_id: userId,
            plan_id: planId,
          },
        });

        stripeSubscriptionId = subscription.id;
      }

      await connection.query(
        `INSERT INTO user_subscriptions 
         (user_id, plan_id, stripe_subscription_id, expires_at) 
         VALUES (?, ?, ?, ?)`,
        [userId, planId, stripeSubscriptionId, expirationDate]
      );

      await connection.commit();
      return { planId, stripeSubscriptionId, expirationDate };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async pauseSubscription(userId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      // Get active subscription
      const [subscription] = await connection.query(
        `SELECT us.* 
         FROM user_subscriptions us
         WHERE us.user_id = ? 
         AND us.status = "active"
         AND us.expires_at > NOW()`,
        [userId]
      );
  
      if (!subscription.length) {
        throw new Error("No active subscription found");
      }
  
      const subscriptionData = subscription[0];
  
      if (subscriptionData.stripe_subscription_id) {
        try {
          // Pause collection in Stripe
          await stripe.subscriptions.update(
            subscriptionData.stripe_subscription_id,
            {
              pause_collection: {
                behavior: 'mark_uncollectible'
              }
            }
          );
  
          // Update local database to past_due
          await connection.query(
            `UPDATE user_subscriptions 
             SET status = "past_due"
             WHERE id = ?`,
            [subscriptionData.id]
          );
  
        } catch (stripeError) {
          console.error('Stripe pause error:', stripeError);
          throw new Error('Failed to pause subscription');
        }
      }
  
      await connection.commit();
      
      return {
        success: true,
        message: "Subscription paused successfully. Will be auto-canceled if not resumed before " + subscriptionData.expires_at,
        expires_at: subscriptionData.expires_at
      };
  
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  static async resumeSubscription(userId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      // Get past_due subscription that hasn't expired
      const [subscription] = await connection.query(
        `SELECT us.* 
         FROM user_subscriptions us
         WHERE us.user_id = ? 
         AND us.status = "past_due"
         AND us.expires_at > NOW()`,
        [userId]
      );
  
      if (!subscription.length) {
        throw new Error("No valid paused subscription found");
      }
  
      const subscriptionData = subscription[0];
  
      if (subscriptionData.stripe_subscription_id) {
        try {
          // Resume subscription in Stripe
          await stripe.subscriptions.update(
            subscriptionData.stripe_subscription_id,
            {
              pause_collection: null // Removes the pause
            }
          );
  
          // Update local database back to active
          await connection.query(
            `UPDATE user_subscriptions 
             SET status = "active"
             WHERE id = ?`,
            [subscriptionData.id]
          );
  
        } catch (stripeError) {
          console.error('Stripe resume error:', stripeError);
          throw new Error('Failed to resume subscription');
        }
      }
  
      await connection.commit();
      
      return {
        success: true,
        message: "Subscription resumed successfully",
        expires_at: subscriptionData.expires_at
      };
  
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async hasActiveSubscription(userId) {
    try {
      const [subscription] = await pool.query(
        `SELECT id FROM user_subscriptions 
         WHERE user_id = ? AND status = 'active' AND expires_at > NOW()`,
        [userId]
      );
      return subscription.length > 0;
    } catch (error) {
      throw error;
    }
  }

  static async syncStripePlans() {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Fetch all Stripe products and prices
      const products = await stripe.products.list({ active: true });
      const prices = await stripe.prices.list({ active: true });

      for (const product of products.data) {
        // Find associated prices for this product
        const productPrices = prices.data.filter(
          (price) => price.product === product.id
        );

        for (const price of productPrices) {
          // Calculate duration months based on interval
          const durationMonths =
            price.recurring.interval === "month"
              ? price.recurring.interval_count
              : price.recurring.interval_count * 12;

          // Check if plan already exists
          const [existingPlan] = await connection.query(
            "SELECT id FROM subscription_plans WHERE stripe_price_id = ?",
            [price.id]
          );

          if (!existingPlan.length) {
            // Insert new plan
            await connection.query(
              `INSERT INTO subscription_plans 
               (name, stripe_price_id, price, duration_months, features) 
               VALUES (?, ?, ?, ?, ?)`,
              [
                product.name,
                price.id,
                price.unit_amount / 100, // Convert from cents to dollars
                durationMonths,
                JSON.stringify(
                  product.metadata.features
                    ? JSON.parse(product.metadata.features)
                    : ["Comments", "Premium Support"]
                ),
              ]
            );
            console.log(`Synced plan: ${product.name} with price ${price.id}`);
          }
        }
      }

      await connection.commit();
      console.log("All Stripe plans synced successfully");
    } catch (error) {
      await connection.rollback();
      console.error("Error syncing Stripe plans:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Helper method to get Stripe price details
  static async getStripePriceDetails(priceId) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      const product = await stripe.products.retrieve(price.product);
      return { price, product };
    } catch (error) {
      console.error("Error fetching Stripe price details:", error);
      throw error;
    }
  }

  static async handleWebhook(event) {
    const connection = await pool.getConnection();
    console.log('Webhook Event:', event.type);
  
    try {
      await connection.beginTransaction();
      
      let subscription;
      const session = event.data.object;
  
      // Retrieve subscription data based on event type
      if (event.type === 'checkout.session.completed') {
        subscription = await stripe.subscriptions.retrieve(session.subscription);
      } else {
        subscription = session;
      }
  
      switch (event.type) {
        case "customer.subscription.updated":
          const [updateResult] = await connection.query(
            `UPDATE user_subscriptions 
             SET status = ?,
                 expires_at = FROM_UNIXTIME(?)
             WHERE stripe_subscription_id = ?`,
            [
              subscription.status,
              subscription.current_period_end,
              subscription.id,
            ]
          );
          
          console.log('Update result:', updateResult.affectedRows, 'rows affected');
          
          if (updateResult.affectedRows === 0) {
            console.warn('No subscription found to update with ID:', subscription.id);
          }
          break;
  
        case "checkout.session.completed":
          const [plan] = await connection.query(
            "SELECT id FROM subscription_plans WHERE stripe_price_id = ?",
            [subscription.items.data[0].price.id]
          );
  
          if (!plan || plan.length === 0) {
            throw new Error(`No matching plan found for price ID: ${subscription.items.data[0].price.id}`);
          }
  
          const [insertResult] = await connection.query(
            `INSERT INTO user_subscriptions 
             (user_id, plan_id, stripe_subscription_id, status, expires_at) 
             VALUES (?, ?, ?, ?, FROM_UNIXTIME(?))`,
            [
              session.metadata.userId,
              plan[0].id,
              subscription.id,
              subscription.status,
              subscription.current_period_end,
            ]
          );
          
          console.log('Insert result:', insertResult.affectedRows, 'rows affected');
          break;
  
        case "customer.subscription.deleted":
          const [deleteResult] = await connection.query(
            `UPDATE user_subscriptions 
             SET status = 'canceled',
                 expires_at = FROM_UNIXTIME(?)
             WHERE stripe_subscription_id = ?`,
            [
              subscription.current_period_end || Math.floor(Date.now() / 1000), 
              subscription.id
            ]
          );
          
          console.log('Delete result:', deleteResult.affectedRows, 'rows affected');
          
          if (deleteResult.affectedRows === 0) {
            console.warn('No subscription found to cancel with ID:', subscription.id);
          }
          break;
  
        default:
          console.log('Unhandled event type:', event.type);
      }
  
      await connection.commit();
    } catch (error) {
      console.error('Webhook handler error:', error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async checkSubscriptionAccess(userId) {
    try {
      const [subscription] = await pool.query(
        `SELECT us.*, sp.features 
         FROM user_subscriptions us
         JOIN subscription_plans sp ON us.plan_id = sp.id
         WHERE us.user_id = ? 
         AND us.status = 'active' 
         AND us.expires_at > NOW()`,
        [userId]
      );
      // console.log("subscription model check called", subscription);
      if (!subscription.length) return null;

      return {
        ...subscription[0],
        // features: JSON.parse(subscription[0].features),
      };
    } catch (error) {
      throw error;
    }
  }

  static async checkSubscriptionFeatures(userId, feature) {
    const subscription = await this.checkSubscriptionAccess(userId);
    return subscription?.features?.includes(feature) || false;
  }

  static async cancelSubscription(userId) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      // Get active subscription with plan details
      const [subscription] = await connection.query(
        `SELECT us.*, sp.name as plan_name 
         FROM user_subscriptions us
         LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
         WHERE us.user_id = ? 
         AND us.status = "active"
         AND us.expires_at > NOW()`,
        [userId]
      );
  
      if (!subscription.length) {
        throw new Error("No active subscription found");
      }
  
      const subscriptionData = subscription[0];
  
      if (subscriptionData.stripe_subscription_id) {
        try {
          // Cancel at period end to maintain access until current period expires
          const canceledStripeSubscription = await stripe.subscriptions.update(
            subscriptionData.stripe_subscription_id,
            {
              cancel_at_period_end: true
            }
          );
  
          // Update local database
          await connection.query(
            `UPDATE user_subscriptions 
             SET status = "canceled"
             WHERE id = ?`,
            [subscriptionData.id]
          );
  
        } catch (stripeError) {
          console.error('Stripe cancellation error:', stripeError);
          throw new Error('Failed to cancel subscription with payment provider');
        }
      } else {
        // For test subscriptions or those without Stripe ID
        await connection.query(
          `UPDATE user_subscriptions 
           SET status = "canceled"
           WHERE id = ?`,
          [subscriptionData.id]
        );
      }
  
      await connection.commit();
      
      return {
        success: true,
        message: "Subscription successfully canceled",
        access_until: subscriptionData.expires_at
      };
  
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Helper method to check subscription status
  static async getSubscriptionStatus(userId) {
    try {
      const [subscription] = await pool.query(
        `SELECT us.*, sp.name as plan_name 
         FROM user_subscriptions us
         LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
         WHERE us.user_id = ? 
         ORDER BY us.created_at DESC 
         LIMIT 1`,
        [userId]
      );
  
      if (!subscription.length) {
        return {
          has_subscription: false,
          status: null,
          expires_at: null
        };
      }
  
      return {
        has_subscription: true,
        status: subscription[0].status,
        plan_name: subscription[0].plan_name,
        expires_at: subscription[0].expires_at,
        is_active: subscription[0].status === 'active' && new Date(subscription[0].expires_at) > new Date()
      };
    } catch (error) {
      console.error('Error checking subscription status:', error);
      throw error;
    }
  }
}

module.exports = SubscriptionModel;
