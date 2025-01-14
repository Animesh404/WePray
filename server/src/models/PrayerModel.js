const pool = require('../config/database');

class PrayerModel {
    static async createSchema() {
        const query = `
            CREATE TABLE IF NOT EXISTS prayers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255),
                user_id INT,
                email VARCHAR(255),
                phone VARCHAR(20),
                message TEXT NOT NULL,
                category VARCHAR(255),
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
        `;

        try {
            await pool.query(query);
            console.log('Prayers table created successfully');
        } catch (error) {
            console.error('Error creating prayers table:', error);
            throw error;
        }
    }

    static async create(prayerData) {
        const { name, country, email, user_id, phone, category, message, is_anonymous, visibility,
            type } = prayerData;
        
        try {
            // const processedName = is_anonymous ? 'Anonymous' : name;
            const processedUserId = is_anonymous ? null : user_id;
            
            const [result] = await pool.query(
                'INSERT INTO prayers (name, user_id, country, email, phone, message, category, visibility, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [name, processedUserId, country, email, phone, message, category, visibility, type]
            );
    
            return { 
                id: result.insertId, 
                ...prayerData,
                name: name,
                user_id: processedUserId
            };
        } catch (error) {
            throw error;
        }
    }
    static async findById(id) {
        try {
            const [rows] = await pool.query(`
                SELECT 
                    p.*,
                    u.name as user_name,
                    r.name as reviewer_name
                FROM prayers p
                LEFT JOIN users u ON p.user_id = u.id
                LEFT JOIN users r ON p.reviewed_by = r.id
                WHERE p.id = ?`,
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async updateMessage(id, newMessage) {
        try {
            const [result] = await pool.query(
                'UPDATE prayers SET message = ? WHERE id = ?',
                [newMessage, id]
            );
            
            if (result.affectedRows === 0) {
                throw new Error('Prayer not found');
            }
    
            return true;
        } catch (error) {
            throw error;
        }
    }

    static async getAll(page = 1, limit = 10, filters = {}) {
    try {
        const offset = (page - 1) * limit
        const whereClauses = [];
        const values = [];

        if (filters.user_id) {
            whereClauses.push("p.user_id = ?");
            values.push(filters.user_id);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        // console.log("Filters:", filters); // Log filters
        // console.log("Where String:", whereString);

        const [prayers] = await pool.query(`
            SELECT 
                p.*,
                u.name as user_name,
                r.name as reviewer_name
            FROM prayers p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN users r ON p.reviewed_by = r.id
            ${whereString}
            ORDER BY
                p.status = 'pending' DESC, 
                p.created_at DESC
            LIMIT ? OFFSET ?`, 
            [...values, limit, offset] 
        );

        // console.log("Fetched Prayers SQL Result:", prayers);

        const [total] = await pool.query(
            `
            SELECT COUNT(*) as count
            FROM prayers p
            ${whereString}`,
            values
        );
        return {
            prayers,
            total: total[0].count
        };
    } catch (error) {
        throw error;
    }
}

static async getAllApprovedPrayers(page = 1, limit = 10) {
    try {
        const offset = (page - 1) * limit
        const [prayers] = await pool.query(`
            SELECT 
                p.*,
                u.name as user_name,
                r.name as reviewer_name
            FROM prayers p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN users r ON p.reviewed_by = r.id
            WHERE p.type = 'prayer'
                AND p.visibility = 1
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?`, 
            [limit, offset] 
        );

        const [total] = await pool.query(
            `
            SELECT COUNT(*) AS count
            FROM prayers
            WHERE type = 'prayer'
                AND visibility = 1
            `
        );
        return {
            prayers,
            total: total[0].count
        };
    } catch (error) {
        throw error;
    }
}

static async getAllApprovedPraises(page = 1, limit = 10) {
    try {
        const offset = (page - 1) * limit
        const [prayers] = await pool.query(`
            SELECT 
                p.*,
                u.name as user_name,
                r.name as reviewer_name
            FROM prayers p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN users r ON p.reviewed_by = r.id
            WHERE p.type = 'praise'
                AND p.visibility = 1
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?`, 
            [limit, offset] 
        );

        const [total] = await pool.query(
            `
            SELECT COUNT(*) AS count
            FROM prayers
            WHERE type = 'praise'
                AND visibility = 1
            `
        );
        return {
            prayers,
            total: total[0].count
        };
    } catch (error) {
        throw error;
    }
}

    static async updateStatus(id, status, reviewerId) {
        try {
            if (status === 'rejected') {
                // Delete the prayer if the status is 'rejected'
                const [deleteResult] = await pool.query('DELETE FROM prayers WHERE id = ?', [id]);
                return deleteResult.affectedRows > 0;
            } else {
                // Update the prayer status and reviewer if not rejected
                const [updateResult] = await pool.query(
                    'UPDATE prayers SET status = ?, reviewed_by = ? WHERE id = ?',
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
    static async updatePrayerCount(id, prayerCount){
        try {
            const [updatedPrayer] = await pool.query(
                'UPDATE prayers SET pray_count = ? WHERE id = ?',
                [prayerCount, id]
            );
            return updatedPrayer.affectedRows > 0;
        } catch (error){
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
                FROM prayers`
            );
            return stats[0];
        } catch (error) {
            throw error;
        }
    }


    static async delete(id) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query('DELETE FROM prayer_reports WHERE prayer_id = ?', [id]);
            const [result] = await connection.query(
                'DELETE FROM prayers WHERE id = ?',
                [id]
            );
            await connection.commit()
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            throw error;
        }finally{
            connection.release();
        }
    }
}
module.exports = PrayerModel;