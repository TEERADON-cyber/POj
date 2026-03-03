const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session && req.session.customer && req.session.customer.role === 'admin') {
    return next();
  }
  res.redirect('/login');
};

router.get('/dashboard', isAdmin, adminController.dashboard);
router.post('/parcel/update-status', isAdmin, adminController.updateStatus);
router.post('/payment/update-status', isAdmin, adminController.updatePaymentStatus);
//router.post('/parcel/delete', isAdmin, adminController.deleteParcel);
router.post('/parcel/cancel', isAdmin, adminController.cancelParcel);
router.post('/parcel/ship', isAdmin, adminController.markShipped);
router.post('/parcel/deliver', isAdmin, adminController.markDelivered);

module.exports = router;
