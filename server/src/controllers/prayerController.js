const PrayerModel = require('../models/PrayerModel');

class PrayerController {
    static async create(req, res) {
        try {
            const prayerData = {
                ...(req.user ? { user_id: req.user.id } : {}),
                ...req.body,
                categories: req.body.categories || [] 
            };
 
            const prayer = await PrayerModel.create(prayerData);
            res.status(201).json({
                success: true,
                data: prayer
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async getAll(req, res) {
        try {
            console.log('=== GetAll Controller Start ===');
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            
            const userId = req.user?.id;
            const isAdmin = req.user?.role === 'admin';
            const isCoordinator = req.user?.role === 'coordinator';
    
            const filters = {};
            
            // Handle user filter
            if (!isAdmin && !isCoordinator && userId) {
                filters.user_id = userId;
            }

            // Handle category filter
            if (req.query.categories) {
                filters.categories = Array.isArray(req.query.categories) 
                    ? req.query.categories 
                    : [req.query.categories];
            }
    
            const {prayers, total} = await PrayerModel.getAll(page, limit, filters);
    
            res.json({
                success: true,
                data: {
                    prayers,
                    total,
                }
            });
        } catch (error) {
            console.error("Error in getAll:", error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    static async getAllApprovedPrayers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const categories = req.query.categories ? 
                (Array.isArray(req.query.categories) ? req.query.categories : [req.query.categories]) 
                : null;
            // console.log(categories);
                
            const {prayers, total, total_pray_count} = await PrayerModel.getAllApprovedPrayers(page, limit, categories);
            
            res.json({
                success: true,
                data: {
                    prayers,
                    total,
                    total_pray_count
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async getAllApprovedPraises(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const categories = req.query.categories ? 
                (Array.isArray(req.query.categories) ? req.query.categories : [req.query.categories]) 
                : null;
                
            const {prayers, total} = await PrayerModel.getAllApprovedPraises(page, limit, categories);
            
            res.json({
                success: true,
                data: {
                    prayers,
                    total,
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

   static async getById(req, res) {
       try {
           const prayer = await PrayerModel.findById(req.params.id);
           
           if (!prayer) {
               return res.status(404).json({
                   success: false,
                   message: 'Prayer request not found'
               });
           }

           res.json({
               success: true,
               data: prayer
           });
       } catch (error) {
           res.status(500).json({
               success: false,
               message: error.message
           });
       }
   }

   static async updateMessage(req, res) {
    try {
        const { message, categories } = req.body;
        const prayerId = req.params.id;
        const userId = req.user.id; // Assuming you have user info in req.user from auth middleware
        
        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        // First check if prayer exists and user owns it
        const prayer = await PrayerModel.findById(prayerId);
        
        if (!prayer) {
            return res.status(404).json({
                success: false,
                message: 'Prayer request not found'
            });
        }

        // Check ownership or admin status
        if (prayer.user_id !== userId && req.user.role !== 'admin' && req.user.role !== 'coordinator') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this prayer request'
            });
        }

        // Update message
        const updatedPrayer = await PrayerModel.updateMessage(prayerId, message);

        // Update categories if provided
        if (categories) {
            await PrayerModel.updateCategories(prayerId, categories);
        }

        res.json({
            success: true,
            message: 'Prayer updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Add new method to update categories
static async updateCategories(req, res) {
    try {
        const { categories } = req.body;
        
        if (!Array.isArray(categories)) {
            return res.status(400).json({
                success: false,
                message: 'Categories must be an array'
            });
        }

        const updated = await PrayerModel.updateCategories(req.params.id, categories);
        
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Prayer request not found'
            });
        }

        res.json({
            success: true,
            message: 'Categories updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
   static async updateStatus(req, res) {
       try {
           const { id } = req.params;
           const { status } = req.body;

           const updated = await PrayerModel.updateStatus(id, status, req.user.id);
           
           if (!updated) {
               return res.status(404).json({
                   success: false,
                   message: 'Prayer request not found'
               });
           }

           res.json({
               success: true,
               message: 'Status updated successfully'
           });
       } catch (error) {
           res.status(500).json({
               success: false,
               message: error.message
           });
       }
   }

   static async getStats(req, res) {
       try {
           const stats = await PrayerModel.getStats();
           res.json({
               success: true,
               data: stats
           });
       } catch (error) {
           res.status(500).json({
               success: false,
               message: error.message
           });
       }
   }

   static async updatePrayerCount(req, res) {
    try{
        const { id } = req.params;
        const { updatedCount } = req.body.data;
        const numericPrayCount = Number(updatedCount);
        
        if (isNaN(numericPrayCount)) {
            console.log(numericPrayCount);
            return res.status(400).json({
                success: false,
                message: 'Invalid prayer count'
            });
        }
        const updated = await PrayerModel.updatePrayerCount(id, updatedCount);
        console.log("type of count received in backend",typeof numericPrayCount);
        res.json({
            success: true,
            data: updated
        })
    }  catch (error) {
        console.error("backend Error:", error.message)
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
   }

//    static async updateReportedCount(req, res) {
//     try{
//         const { reportCount } = req.body;
//         const updated = await PrayerModel.updateReportedCount(req.params.id, reportCount);
//         res.json({
//             success: true,
//             data: updated
//         })
//     }  catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
//    }

   static async delete(req, res) {
    try {
        const prayerId = req.params.id;
        const userId = req.user.id;
        const prayer = await PrayerModel.findById(prayerId);
        
        if (!prayer) {
            return res.status(404).json({
                success: false,
                message: 'Prayer request not found'
            });
        }

        // Check ownership or admin status
        if (prayer.user_id !== userId && req.user.role !== 'admin' && req.user.role !== 'coordinator') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this prayer request'
            });
        }
        const deleted = await PrayerModel.delete(req.params.id);
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Prayer request not found'
            });
        }
 
        res.json({
            success: true,
            message: 'Prayer request deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
 }

   static async getPending(req, res) {
       try {
           const page = parseInt(req.query.page) || 1;
           const limit = parseInt(req.query.limit) || 10;
           
           const prayers = await PrayerModel.getByStatus('pending', page, limit);
           
           res.json({
               success: true,
               data: prayers
           });
       } catch (error) {
           res.status(500).json({
               success: false,
               message: error.message
           });
       }
   }
}


module.exports = PrayerController;