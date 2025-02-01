const pool = require("../config/database");
const SubscriptionModel = require("./SubscriptionModel");

class CommentModel {
  static async createSchema() {
    const query = `CREATE TABLE IF NOT EXISTS comments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        prayer_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (prayer_id) REFERENCES prayers(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`;
  
      try {
        await pool.query(query);
        console.log("Comments schema created successfully");
      } catch (error) {
        console.error("Error creating comments schema:", error);
        throw error;
      }
    }
  

  // Create a new comment
  static async create(commentData) {
    const connection = await pool.getConnection();
    const hasSubscription = await SubscriptionModel.checkSubscriptionAccess(commentData.user_id);
  if (!hasSubscription) {
    throw new Error("Active subscription required");
  }
    try {
      await connection.beginTransaction();

      const { prayer_id, user_id, content } = commentData;

      // Check if user has active subscription
      const [subscriptionStatus] = await connection.query(
        `SELECT status FROM user_subscriptions 
         WHERE user_id = ? AND status = 'active' AND expires_at > NOW()`,
        [user_id]
      );

      if (!subscriptionStatus.length) {
        throw new Error("User does not have an active subscription");
      }

      // Insert comment
      const [result] = await connection.query(
        "INSERT INTO comments (prayer_id, user_id, content) VALUES (?, ?, ?)",
        [prayer_id, user_id, content]
      );

      await connection.commit();
      return { id: result.insertId, ...commentData };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get comments for a prayer
  static async getCommentsByPrayer(prayerId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const [comments] = await pool.query(
        `SELECT 
          c.*,
          u.name as user_name,
          u.email as user_email
         FROM comments c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.prayer_id = ?
         ORDER BY c.created_at DESC
         LIMIT ? OFFSET ?`,
        [prayerId, limit, offset]
      );

      const [total] = await pool.query(
        "SELECT COUNT(*) as count FROM comments WHERE prayer_id = ?",
        [prayerId]
      );

      return {
        comments,
        total: total[0].count
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete a comment
  static async delete(commentId, userId) {
    try {
      const [result] = await pool.query(
        "DELETE FROM comments WHERE id = ? AND user_id = ?",
        [commentId, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Check if user has active subscription
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
}

module.exports = CommentModel;