const pool = require("../config/database");

class PrayerModel {
  static async createSchema() {
    const queries = [
      `
            CREATE TABLE IF NOT EXISTS prayers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255),
                user_id INT,
                email VARCHAR(255),
                phone VARCHAR(20),
                message TEXT NOT NULL,
                country VARCHAR(255),
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                visibility BOOL DEFAULT True,
                type ENUM('prayer', 'praise') DEFAULT 'prayer',
                reviewed_by INT,
                pray_count INT DEFAULT 0,
                report_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (reviewed_by) REFERENCES users(id)
            )
        `,
      // Categories table
      `CREATE TABLE IF NOT EXISTS categories (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,

      // Prayer categories junction table
      `CREATE TABLE IF NOT EXISTS prayer_categories (
            prayer_id INT,
            category_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (prayer_id, category_id),
            FOREIGN KEY (prayer_id) REFERENCES prayers(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        )`,
    ];

    try {
      for (const query of queries) {
        await pool.query(query);
      }

      // Insert predefined categories
      const categories = [
        "Thanksgiving",
        "Confession",
        "Intercession",
        "Petition",
        "Healing",
        "Protection",
        "Deliverance",
        "Guidance",
        "Strength",
        "Peace",
        "Forgiveness",
        "Hope",
        "Faith",
        "Love",
        "Unity",
        "Wisdom",
        "Comfort",
        "Blessings",
        "Gratitude",
        "Others",
      ];

      const newCategories = [
        "Marriage",
        "Family",
        "Finances",
        "Employment",
        "Health",
        "Spiritual",
      ];

      const allCategories = [...new Set([...categories, ...newCategories])];

      const insertCategoryQuery =
        "INSERT IGNORE INTO categories (name) VALUES ?";
      await pool.query(insertCategoryQuery, [
        allCategories.map((cat) => [cat]),
      ]);

      console.log("Prayer categories schema created successfully");
    } catch (error) {
      console.error("Error creating prayer categories schema:", error);
      throw error;
    }
  }

  static async create(prayerData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const {
        name,
        country,
        email,
        user_id,
        phone,
        message,
        is_anonymous,
        visibility,
        type,
        categories,
      } = prayerData;

      const processedUserId = is_anonymous ? null : user_id;

      // Insert prayer
      const [result] = await connection.query(
        "INSERT INTO prayers (name, user_id, country, email, phone, message, visibility, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          name,
          processedUserId,
          country,
          email,
          phone,
          message,
          visibility,
          type,
        ]
      );

      const prayerId = result.insertId;
      console.log("Inserted prayer with ID:", prayerId);
      console.log("user id of prayer", processedUserId);

      // Insert prayer categories if provided
      if (categories && categories.length > 0) {
        const [categoryRows] = await connection.query(
          "SELECT id FROM categories WHERE name IN (?)",
          [categories]
        );

        if (categoryRows.length > 0) {
          const categoryValues = categoryRows.map((cat) => [prayerId, cat.id]);
          await connection.query(
            "INSERT INTO prayer_categories (prayer_id, category_id) VALUES ?",
            [categoryValues]
          );
        }
      }

      await connection.commit();

      return {
        id: prayerId,
        ...prayerData,
        name: name,
        user_id: processedUserId,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  static async findById(id) {
    try {
      const [prayers] = await pool.query(
        `
            SELECT 
                p.*,
                u.name as user_name,
                r.name as reviewer_name,
                GROUP_CONCAT(c.name) as categories
            FROM prayers p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN users r ON p.reviewed_by = r.id
            LEFT JOIN prayer_categories pc ON p.id = pc.prayer_id
            LEFT JOIN categories c ON pc.category_id = c.id
            WHERE p.id = ?
            GROUP BY p.id`,
        [id]
      );

      if (prayers[0]) {
        prayers[0].categories = prayers[0].categories
          ? prayers[0].categories.split(",")
          : [];
      }

      return prayers[0];
    } catch (error) {
      throw error;
    }
  }

  static async updateMessage(id, newMessage) {
    try {
      const [result] = await pool.query(
        "UPDATE prayers SET message = ? WHERE id = ?",
        [newMessage, id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Prayer not found");
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  static async getAll(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      const whereClauses = [];
      const values = [];

      if (filters.user_id) {
        whereClauses.push("p.user_id = ?");
        values.push(filters.user_id);
      }

      if (filters.categories && filters.categories.length > 0) {
        const placeholders = Array(filters.categories.length)
          .fill("?")
          .join(",");
        whereClauses.push(`
                EXISTS (
                    SELECT 1
                    FROM prayer_categories pc2
                    JOIN categories c2 ON pc2.category_id = c2.id
                    WHERE pc2.prayer_id = p.id
                    AND c2.name IN (${placeholders})
                    GROUP BY pc2.prayer_id
                    HAVING COUNT(DISTINCT c2.name) = ?
                )
            `);
        // Add each category as a separate parameter
        values.push(...filters.categories);
        values.push(filters.categories.length);
      }

      const whereString =
        whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

      // console.log("Query values:", values);

      const [prayers] = await pool.query(
        `
            SELECT 
                p.*,
                u.name as user_name,
                r.name as reviewer_name,
                GROUP_CONCAT(DISTINCT c.name) as categories
            FROM prayers p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN users r ON p.reviewed_by = r.id
            LEFT JOIN prayer_categories pc ON p.id = pc.prayer_id
            LEFT JOIN categories c ON pc.category_id = c.id
            ${whereString}
            GROUP BY p.id
            ORDER BY p.status = 'pending' DESC, p.created_at DESC
            LIMIT ? OFFSET ?`,
        [...values, limit, offset]
      );

      // Process categories
      prayers.forEach((prayer) => {
        prayer.categories = prayer.categories
          ? prayer.categories.split(",")
          : [];
      });

      const [total] = await pool.query(
        `
            SELECT COUNT(DISTINCT p.id) as count
            FROM prayers p
            LEFT JOIN prayer_categories pc ON p.id = pc.prayer_id
            LEFT JOIN categories c ON pc.category_id = c.id
            ${whereString}`,
        values
      );

      // console.log("Found prayers:", prayers.length);
      return {
        prayers,
        total: total[0].count,
      };
    } catch (error) {
      console.error("Error in getAll:", error);
      throw error;
    }
  }

  // Helper method to update prayer categories
  static async updateCategories(prayerId, categories) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Remove existing categories
      await connection.query(
        "DELETE FROM prayer_categories WHERE prayer_id = ?",
        [prayerId]
      );

      // Add new categories
      if (categories && categories.length > 0) {
        const [categoryRows] = await connection.query(
          "SELECT id FROM categories WHERE name IN (?)",
          [categories]
        );

        if (categoryRows.length > 0) {
          const categoryValues = categoryRows.map((cat) => [prayerId, cat.id]);
          await connection.query(
            "INSERT INTO prayer_categories (prayer_id, category_id) VALUES ?",
            [categoryValues]
          );
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getAllApprovedPrayers(page = 1, limit = 10, categories = null) {
    try {
      const offset = (page - 1) * limit;
      let queryParams = [];
      // console.log("Categories received in model:", categories);

      let query = `
            SELECT 
                p.*,
                u.name as user_name,
                r.name as reviewer_name,
                GROUP_CONCAT(DISTINCT c.name) as categories
            FROM prayers p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN users r ON p.reviewed_by = r.id
            LEFT JOIN prayer_categories pc ON p.id = pc.prayer_id
            LEFT JOIN categories c ON pc.category_id = c.id
            WHERE p.type = 'prayer'
                AND p.visibility = 1`;

      let countQuery = `
            SELECT COUNT(DISTINCT p.id) AS count
            FROM prayers p
            LEFT JOIN prayer_categories pc ON p.id = pc.prayer_id
            LEFT JOIN categories c ON pc.category_id = c.id
            WHERE p.type = 'prayer'
                AND p.visibility = 1`;

      // Add category filter if categories are provided
      if (categories && categories.length > 0) {
        const placeholders = Array(categories.length).fill("?").join(",");
        query += ` AND EXISTS (
                SELECT 1
                FROM prayer_categories pc2
                JOIN categories c2 ON pc2.category_id = c2.id
                WHERE pc2.prayer_id = p.id
                AND c2.name IN (${placeholders})
                GROUP BY pc2.prayer_id
                HAVING COUNT(DISTINCT c2.name) = ?
            )`;
        countQuery += ` AND EXISTS (
                SELECT 1
                FROM prayer_categories pc2
                JOIN categories c2 ON pc2.category_id = c2.id
                WHERE pc2.prayer_id = p.id
                AND c2.name IN (${placeholders})
                GROUP BY pc2.prayer_id
                HAVING COUNT(DISTINCT c2.name) = ?
            )`;

        // Add each category as a separate parameter
        queryParams.push(...categories);
        queryParams.push(categories.length);
      }

      // Add group by, order by, and limit
      query += `
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?`;

      // Add limit and offset to params
      queryParams.push(limit, offset);

      // console.log("Final query:", query);
      // console.log("Query params:", queryParams);

      // Execute queries
      const [prayers] = await pool.query(query, queryParams);

      // For count query, we need to pass the categories again
      const countParams =
        categories && categories.length > 0
          ? [...categories, categories.length]
          : [];
      const [total] = await pool.query(countQuery, countParams);

      // Process categories for each prayer
      prayers.forEach((prayer) => {
        prayer.categories = prayer.categories
          ? prayer.categories.split(",")
          : [];
      });

      // console.log("Prayers found:", prayers.length);
      return {
        prayers,
        total: total[0].count,
      };
    } catch (error) {
      console.error("Error in getAllApprovedPrayers:", error);
      throw error;
    }
  }

  static async getAllApprovedPraises(page = 1, limit = 10, categories = null) {
    try {
      const offset = (page - 1) * limit;
      let queryParams = [];
      // console.log("Categories received in model:", categories);

      let query = `
            SELECT 
                p.*,
                u.name as user_name,
                r.name as reviewer_name,
                GROUP_CONCAT(DISTINCT c.name) as categories
            FROM prayers p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN users r ON p.reviewed_by = r.id
            LEFT JOIN prayer_categories pc ON p.id = pc.prayer_id
            LEFT JOIN categories c ON pc.category_id = c.id
            WHERE p.type = 'praise'
                AND p.visibility = 1`;

      let countQuery = `
            SELECT COUNT(DISTINCT p.id) AS count
            FROM prayers p
            LEFT JOIN prayer_categories pc ON p.id = pc.prayer_id
            LEFT JOIN categories c ON pc.category_id = c.id
            WHERE p.type = 'praise'
                AND p.visibility = 1`;

      // Add category filter if categories are provided
      if (categories && categories.length > 0) {
        const placeholders = Array(categories.length).fill("?").join(",");
        query += ` AND EXISTS (
                SELECT 1
                FROM prayer_categories pc2
                JOIN categories c2 ON pc2.category_id = c2.id
                WHERE pc2.prayer_id = p.id
                AND c2.name IN (${placeholders})
                GROUP BY pc2.prayer_id
                HAVING COUNT(DISTINCT c2.name) = ?
            )`;
        countQuery += ` AND EXISTS (
                SELECT 1
                FROM prayer_categories pc2
                JOIN categories c2 ON pc2.category_id = c2.id
                WHERE pc2.prayer_id = p.id
                AND c2.name IN (${placeholders})
                GROUP BY pc2.prayer_id
                HAVING COUNT(DISTINCT c2.name) = ?
            )`;

        // Add each category as a separate parameter
        queryParams.push(...categories);
        queryParams.push(categories.length);
      }

      // Add group by, order by, and limit
      query += `
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?`;

      // Add limit and offset to params
      queryParams.push(limit, offset);

      // console.log("Final query:", query);
      // console.log("Query params:", queryParams);

      // Execute queries
      const [prayers] = await pool.query(query, queryParams);

      // For count query, we need to pass the categories again
      const countParams =
        categories && categories.length > 0
          ? [...categories, categories.length]
          : [];
      const [total] = await pool.query(countQuery, countParams);

      // Process categories for each prayer
      prayers.forEach((prayer) => {
        prayer.categories = prayer.categories
          ? prayer.categories.split(",")
          : [];
      });

      // console.log("Praises found:", prayers.length);
      return {
        prayers,
        total: total[0].count,
      };
    } catch (error) {
      console.error("Error in getAllApprovedPraises:", error);
      throw error;
    }
  }

  static async updateStatus(id, status, reviewerId) {
    try {
      if (status === "rejected") {
        // Delete the prayer if the status is 'rejected'
        const [deleteResult] = await pool.query(
          "DELETE FROM prayers WHERE id = ?",
          [id]
        );
        return deleteResult.affectedRows > 0;
      } else {
        // Update the prayer status and reviewer if not rejected
        const [updateResult] = await pool.query(
          "UPDATE prayers SET status = ?, reviewed_by = ? WHERE id = ?",
          [status, reviewerId, id]
        );
        return updateResult.affectedRows > 0;
      }
    } catch (error) {
      throw error;
    }
  }

  // static async updateReportedCount(id, reportedCount){
  //     try {
  //         const [updatedReportCount] = await pool.query(
  //             'UPDATE prayers SET reported_count = ? WHERE id = ?',
  //             [reportedCount, id]
  //         );
  //         return updatedReportCount.affectedRows > 0;
  //     } catch (error){
  //         throw error;
  //     }
  // }
  static async updatePrayerCount(id, prayerCount) {
    try {
      const [updatedPrayer] = await pool.query(
        "UPDATE prayers SET pray_count = ? WHERE id = ?",
        [prayerCount, id]
      );
      return updatedPrayer.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getStats() {
    try {
      const [stats] = await pool.query(`
                SELECT 
                    COUNT(*) as total_prayers,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_prayers,
                    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_prayers,
                    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_prayers,
                    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as last_24h
                FROM prayers`);
      return stats[0];
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query("DELETE FROM prayer_reports WHERE prayer_id = ?", [
        id,
      ]);
      const [result] = await connection.query(
        "DELETE FROM prayers WHERE id = ?",
        [id]
      );
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
module.exports = PrayerModel;
