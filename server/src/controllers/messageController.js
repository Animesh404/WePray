const MessageModel = require("../models/MessageModel");

class MessageController {
  static async create(req, res) {
    try {
      const message = await MessageModel.create({
        ...req.body,
        user_id: req.user.id,
      });

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getMessagesByPrayer(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await MessageModel.getMessagesByPrayer(
        req.params.prayerId,
        req.user.id,
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

  static async getMessagesByUser(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const result = await MessageModel.getMessagesByUser(
        req.user.id,
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

  static async getMessagesForUser(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
    //   console.log(req.user.id);
      const result = await MessageModel.getMessagesForUser(
        req.user.id,
        parseInt(page),
        parseInt(limit)
      );
      res.json({
        success: true,
        data: result,
      });
    //   console.log(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const success = await MessagModel.delete(req.params.id);
      if (success) {
        res.json({ message: "message deleted successfully" });
      } else {
        res.status(404).json({ message: "message not found or unauthorized" });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = MessageController;
