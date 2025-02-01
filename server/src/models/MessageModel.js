const pool = require("../config/database");

class MessageModel {
  static async createSchema() {
    const query = `CREATE TABLE IF NOT EXISTS messages (
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
        console.log("Messages schema created successfully");
      } catch (error) {
        console.error("Error creating messages schema:", error);
        throw error;
      }
    }
  

  // Create a new comment
  static async create(messageData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { prayer_id, user_id, content } = messageData;

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
        "INSERT INTO messages (prayer_id, user_id, content) VALUES (?, ?, ?)",
        [prayer_id, user_id, content]
      );

      await connection.commit();
      return { id: result.insertId, ...messageData };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getMessagesByPrayer(prayerId, userId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const [messages] = await pool.query(
        `SELECT 
          m.*,
          u.name as user_name,
          u.email as user_email
         FROM messages m
         LEFT JOIN users u ON m.user_id = u.id
         WHERE m.prayer_id = ? AND
         m.user_id = ?
         ORDER BY m.created_at DESC
         LIMIT ? OFFSET ?`,
        [prayerId, userId, limit, offset]
      );

      const [total] = await pool.query(
        "SELECT COUNT(*) as count FROM messages WHERE prayer_id = ?",
        [prayerId]
      );

      return {
        messages,
        total: total[0].count
      };
    } catch (error) {
      throw error;
    }
  }

  static async getMessagesForUser( userId, page = 1, limit = 10) {
    try {
        const offset = (page - 1) * limit;
        // console.log("inside inbox method");
        const [messages] = await pool.query(
          `SELECT 
            m.*,
            u.name as user_name,
            u.email as user_email,
            p.user_id as prayer_owner_id
           FROM messages m
           LEFT JOIN users u ON m.user_id = u.id
           LEFT JOIN prayers p ON m.prayer_id = p.id
           WHERE p.user_id = ?
           ORDER BY m.created_at DESC
           LIMIT ? OFFSET ?`,
          [userId, limit, offset]
        );
        // console.log("inbox object:", messages);

      const [totalRows] = await pool.query(
        `SELECT COUNT(*) as total
         FROM messages m
         LEFT JOIN prayers p ON m.prayer_id = p.id
         WHERE p.user_id = ?`,
        [userId]
      );

      return {
        messages,
        total: totalRows[0].total
      };
    } catch (error) {
      throw error;
    }
  }

  static async getMessagesByUser( userId, page = 1, limit = 10) {
    try {
        const offset = (page - 1) * limit;
        const [messages] = await pool.query(
          `SELECT 
            *
           FROM messages m
           WHERE m.user_id = ?
           ORDER BY m.created_at DESC
           LIMIT ? OFFSET ?`,
          [userId, limit, offset]
        );
        // console.log(messages);
      const [totalRows] = await pool.query(
        `SELECT COUNT(*) as total
         FROM messages m
         WHERE m.user_id = ?`,
        [userId]
      );

      return {
        messages,
        total: totalRows[0].total
      };
    } catch (error) {
      throw error;
    }
  }


  // Delete a comment
  static async delete(messageId) {
    try {
      const [result] = await pool.query(
        "DELETE FROM messages WHERE id = ?",
        [messageId]
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

module.exports = MessageModel;