const Parcel = require('../models/Parcel');
const Payment = require('../models/Payment');

// Simple shipping cost calculation example
function calculateShippingCost(weight) {
  const base = 30; // base fee
  const perKg = 20; // per kg
  return base + perKg * Math.max(0, weight);
}

function generateTrackingNumber() {
  const now = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 9000 + 1000).toString();
  return `PD-${now}-${rand}`;
}

const parcelController = {
  showCreate: (req, res) => res.render('create-parcel'),
  createParcel: (req, res) => {
    const sender_id = req.session.customer.id;
    const { receiver_name, receiver_phone, receiver_address, weight, size } = req.body;
    const w = parseFloat(weight) || 0;
    const shipping_cost = calculateShippingCost(w);
    const tracking_number = generateTrackingNumber();
    Parcel.create({ tracking_number, sender_id, receiver_name, receiver_phone, receiver_address, weight: w, size, shipping_cost, status: 'Pending' }, (err, parcel_id) => {
      if (err) return res.render('create-parcel', { error: 'Failed to create parcel' });
      // payment will be created when customer actually pays
      res.redirect('/parcels/' + parcel_id);
    });
  },
  dashboard: (req, res) => {
    const sender_id = req.session.customer.id;
    const message = req.query.msg;
    Parcel.findBySender(sender_id, (err, rows) => {
      if (err) return res.render('dashboard', { error: 'DB error', parcels: [], message });
      res.render('dashboard', { parcels: rows, message });
    });
  },
  viewParcel: (req, res) => {
    const id = req.params.id;
    const userRole = req.session.customer.role;
    Parcel.findById(id, (err, parcel) => {
      if (err || !parcel) return res.render('dashboard', { error: 'Parcel not found' });
      Payment.findByParcel(parcel.parcel_id, (err2, payment) => {
        res.render('tracking', { parcel, payment, userRole });
      });
    });
  },
  updateStatus: (req, res) => {
    const { parcel_id, status } = req.body;
    const db = require('../Database/Database');
    db.run('UPDATE Parcels SET status = ? WHERE parcel_id = ?', [status, parcel_id], function (err) {
      if (err) return res.json({ error: 'Failed to update status' });
      res.json({ success: true, message: 'Status updated' });
    });
  },

  // customer cancels own parcel
  cancelParcel: (req, res) => {
    const parcelId = req.params.id;
    const userId = req.session.customer.id;
    Parcel.findById(parcelId, (err, parcel) => {
      if (err || !parcel || parcel.sender_id !== userId) {
        return res.redirect('/parcels/dashboard');
      }
      if (parcel.status !== 'Pending' && parcel.status !== 'Paid') {
        return res.redirect('/parcels/dashboard');
      }
      const db = require('../Database/Database');
      // if already paid, cancel payment row too
      if (parcel.status === 'Paid') {
        db.run('UPDATE Payments SET payment_status = ? WHERE parcel_id = ?', ['Cancelled', parcelId]);
      }
      db.run('UPDATE Parcels SET status = ? WHERE parcel_id = ?', ['Cancelled', parcelId], err2 => {
        res.redirect('/parcels/dashboard?msg=Parcel+cancelled');
      });
    });
  },
  payments: (req, res) => {
    const sender_id = req.session.customer.id;
    const db = require('../Database/Database');
    
    // Get all payments for parcels sent by this customer
    db.all(`
      SELECT p.payment_id, p.payment_status, p.payment_date,
             pl.tracking_number, pl.receiver_name, pl.status AS parcel_status, pl.shipping_cost
      FROM Payments p
      JOIN Parcels pl ON p.parcel_id = pl.parcel_id
      WHERE pl.sender_id = ?
      ORDER BY p.payment_date DESC
    `, [sender_id], (err, payments) => {
      if (err) return res.render('payments', { error: 'DB error', payments: [] });
      res.render('payments', { payments: payments || [], error: undefined });
    });
  }
};

module.exports = { parcelController, calculateShippingCost };
