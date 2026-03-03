const Parcel = require('../models/Parcel');
const Payment = require('../models/Payment');

const adminController = {
  dashboard: (req, res) => {
    const db = require('../Database/Database');
    // Get all parcels with sender name joined
    db.all(`
      SELECT pl.*, c.customer_name
      FROM Parcels pl
      JOIN Customers c ON pl.sender_id = c.customer_id
      ORDER BY pl.created_at DESC
    `, (err, parcels) => {
      if (err) return res.render('admin-dashboard', { error: 'DB error', parcels: [] });
      
      // Get all payments with additional info
      db.all(`
        SELECT p.payment_id, p.parcel_id, p.amount, p.payment_method, p.payment_status, p.payment_date
        FROM Payments p
        ORDER BY p.payment_date DESC
      `, (err2, payments) => {
        if (err2) payments = [];
        res.render('admin-dashboard', { parcels, payments });
      });
    });
  },
  // transition operations
  cancelParcel: (req, res) => {
    const { parcel_id } = req.body;
    const db = require('../Database/Database');
    db.run('UPDATE Parcels SET status = ? WHERE parcel_id = ?', ['Cancelled', parcel_id], () => {
      res.redirect('/admin/dashboard');
    });
  },
  markShipped: (req, res) => {
    const { parcel_id } = req.body;
    const db = require('../Database/Database');
    db.run('UPDATE Parcels SET status = ? WHERE parcel_id = ?', ['Shipped', parcel_id], () => {
      res.redirect('/admin/dashboard');
    });
  },
  markDelivered: (req, res) => {
    const { parcel_id } = req.body;
    const db = require('../Database/Database');
    db.run('UPDATE Parcels SET status = ? WHERE parcel_id = ?', ['Delivered', parcel_id], () => {
      res.redirect('/admin/dashboard');
    });
  },
  updatePaymentStatus: (req, res) => {
    const { payment_id, payment_status } = req.body;
    // only Completed or Failed allowed
    const status = payment_status === 'Failed' ? 'Failed' : 'Completed';
    const db = require('../Database/Database');
    db.run('UPDATE Payments SET payment_status = ? WHERE payment_id = ?', [status, payment_id], function (err) {
      if (err) return res.redirect('/admin/dashboard');
      res.redirect('/admin/dashboard');
    });
  }

  // remove a parcel and any associated payment
  deleteParcel: (req, res) => {
    const parcelId = req.body.parcel_id;
    const db = require('../Database/Database');
    // delete payment first (if exists) then parcel
    db.run('DELETE FROM Payments WHERE parcel_id = ?', [parcelId], function (err) {
      // ignore error, continue to remove parcel
      db.run('DELETE FROM Parcels WHERE parcel_id = ?', [parcelId], function (err2) {
        res.redirect('/admin/dashboard');
      });
    });
  }
};

module.exports = adminController;
