const { Router } = require('express');
const router = Router();

const authRoutes = require('./auth');
const userRoutes = require('./users');
const prayerRoutes = require('./prayers');
const eventRoutes = require('./events');
const pReportRoutes = require('./pReports')
const commentRoutes = require('./comments');
const messageRoutes = require('./messages');
const subscriptionRoutes = require('./subscriptions');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/prayers', prayerRoutes);
router.use('/events', eventRoutes);
router.use('/pReports', pReportRoutes);
router.use('/comments', commentRoutes);
router.use('/messages', messageRoutes);
router.use('/subscription', subscriptionRoutes);

module.exports = router;