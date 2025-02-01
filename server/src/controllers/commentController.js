const CommentModel = require("../models/CommentModel");

class CommentController {
  static async create(req, res) {
    try {
      const comment = await CommentModel.create({
        ...req.body,
        user_id: req.user.id,
      });

      res.status(201).json({
        success: true,
        data: comment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getCommentsByPrayer(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await CommentModel.getCommentsByPrayer(
        req.params.prayerId,
        parseInt(page),
        parseInt(limit)
      );
      res.json({
        success: true,
        data: result,
      });
      //   res.json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const success = await CommentModel.delete(req.params.id, req.user.id);
      if (success) {
        res.json({ message: "Comment deleted successfully" });
      } else {
        res.status(404).json({ message: "Comment not found or unauthorized" });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = CommentController;
