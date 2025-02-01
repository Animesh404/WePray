const router = require('express').Router();
const PrayerController = require('../controllers/prayerController');
const { isAuth, isCoordinator, isAdmin } = require('../middleware/auth');
const { validate, check } = require('../middleware/validate');

const prayerValidations = {
   create: [
       check('message').notEmpty().withMessage('Message is required')
           .isLength({ min: 10 }).withMessage('Message must be at least 10 characters')
   ],
   updateStatus: [
       check('status').isIn(['pending', 'approved', 'rejected'])
           .withMessage('Invalid status value')
   ],
   approved: [
    check('page').optional().isInt({ min: 1 }),
    check('limit').optional().isInt({ min: 1, max: 100 })
  ]
};

router.post('/', validate(prayerValidations.create), PrayerController.create);
router.post('/authUser',isAuth, validate(prayerValidations.create), PrayerController.create);
router.get('/', 
  (req, res, next) => {
      console.log('Route handler start');
      next();
  },
  isAuth,
  (req, res, next) => {
      console.log('After auth middleware, user:', req.user);
      next();
  },
  PrayerController.getAll
);
router.get('/approvedPrayers', validate(prayerValidations.approved),  PrayerController.getAllApprovedPrayers);
router.get('/approvedPraises', validate(prayerValidations.approved),  PrayerController.getAllApprovedPraises);
router.get('/stats', isAuth, isCoordinator, PrayerController.getStats);
router.get('/pending', isAuth, isCoordinator, PrayerController.getPending);
router.get('/:id', PrayerController.getById);
router.put('/:id/prayCount', PrayerController.updatePrayerCount);
router.put('/:id/message', isAuth, PrayerController.updateMessage);
router.put('/:id/status', 
   isAuth, 
   isCoordinator, 
   validate(prayerValidations.updateStatus), 
   PrayerController.updateStatus
);
router.delete('/:id', isAuth,  PrayerController.delete);

module.exports = router;