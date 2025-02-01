const CommentModel = require('../models/CommentModel');

const checkSubscription = async (req, res, next) => {
    try {
      const hasSubscription = await CommentModel.hasActiveSubscription(req.user.id);
      if (!hasSubscription) {
        return res.status(403).json({
          message: 'This feature requires an active subscription'
        });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: 'Error checking subscription status' });
    }
  };
  
  module.exports = { checkSubscription };