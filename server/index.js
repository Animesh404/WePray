const express = require('express');
const cors = require('cors');
const session = require('express-session');
const routes = require('./src/routes');
const passport = require('passport');
const UserModel = require('./src/models/UserModel');
const PrayerModel = require('./src/models/PrayerModel');
const EventModel = require('./src/models/EventModel');
const PReportModel = require('./src/models/PReportModel');
const SubscriptionModel = require('./src/models/SubscriptionModel');
const CommentModel = require('./src/models/CommentModel');
const MessageModel = require('./src/models/MessageModel');
const subscriptionController = require('./src/controllers/subscriptionController');
require('dotenv').config();
require('./src/config/passport');

const app = express();

async function initializeDatabase() {
    try {
        await UserModel.createSchema();
        await PrayerModel.createSchema();
        await EventModel.createSchema();
        await PReportModel.createSchema();
        // await CommentModel.createSchema();
        await MessageModel.createSchema();
        await SubscriptionModel.createSchema();
        console.log('All database schemas created successfully');
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
}

async function initializeServer() {
    try {
        await initializeDatabase();
        const PORT = process.env.PORT || 8000;
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (error) {
        console.error('Server initialization failed:', error);
        process.exit(1);
    }
}

initializeServer();
app.post('/api/subscription/webhook',
    express.raw({ type: 'application/json' }),
    subscriptionController.handleWebhook
  );
  
// Middleware
app.use(cors({
   origin: process.env.FRONTEND_URL,
   credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session and Passport
app.use(session({
   secret: process.env.SESSION_SECRET,
   resave: false,
   saveUninitialized: false,
   cookie: {
       secure: process.env.NODE_ENV === 'production',
       maxAge: 24 * 60 * 60 * 1000 // 24 hours
   }
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
   res.json({ status: 'ok' });
});

// Error handling
app.use((err, req, res, next) => {
   console.error(err.stack);
   res.status(err.status || 500).json({
       success: false,
       message: err.message || 'Internal server error'
   });
});

// 404 handler
app.use((req, res) => {
   res.status(404).json({
       success: false,
       message: 'Route not found'
   });
});

// const PORT = process.env.PORT || 8000;
// app.listen(PORT, () => {
//    console.log(`Server running on port ${PORT}`);
// });

process.on('unhandledRejection', (err) => {
   console.error('Unhandled Rejection:', err);
   process.exit(1);
});