const Parcel = require('../models/Parcel');
const Payment = require('../models/Payment');
const QRCode = require('qrcode');

const paymentController = {
  // show payment form for a parcel
  showPayment: (req, res) => {
    const parcelId = req.params.id;
    const userId = req.session.customer.id;
    Parcel.findById(parcelId, (err, parcel) => {
      if (err || !parcel) return res.redirect('/parcels/dashboard');
      if (parcel.sender_id !== userId) return res.redirect('/parcels/dashboard');
      if (parcel.status !== 'Pending') {
        return res.redirect('/parcels/' + parcelId);
      }

      // Payment methods with QR code data
      const methods = [
        { id: 'bank', name: 'Bank Transfer', icon: '🏦' },
        { id: 'wallet', name: 'Mobile Wallet', icon: '📱' },
        { id: 'card', name: 'Credit Card', icon: '💳' },
        { id: 'cash', name: 'Cash on Delivery', icon: '💵' }
      ];

      // Generate QR codes for each method (async)
      Promise.all(methods.map(m => 
        QRCode.toDataURL(`PAY-${parcel.parcel_id}-${m.id}-${Math.random().toString(36).substr(2, 9)}`)
          .then(qr => ({ ...m, qrCode: qr }))
      )).then(methodsWithQR => {
        res.render('payment', { parcel, error: undefined, methods: methodsWithQR });
      }).catch(err => {
        res.render('payment', { parcel, error: 'Failed to generate QR codes', methods });
      });
    });
  },

  // handle payment submission
  payParcel: (req, res) => {
    const parcelId = req.params.id;
    const userId = req.session.customer.id;
    const amountInput = parseFloat(req.body.amount) || 0;

    Parcel.findById(parcelId, (err, parcel) => {
      if (err || !parcel || parcel.sender_id !== userId) {
        return res.redirect('/parcels/dashboard');
      }
      if (parcel.status !== 'Pending') {
        return res.render('payment', { parcel, error: 'Parcel is not pending payment' });
      }

      const realPrice = parcel.shipping_cost;
      if (amountInput < realPrice) {
        return res.render('payment', { parcel, error: 'จำนวนเงินไม่เพียงพอ' });
      }

      const finalAmount = realPrice; // ignore any extra input

      // ensure we don't create duplicate rows – check existing payment
      Payment.findByParcel(parcelId, (errP, existing) => {
        const db = require('../Database/Database');
        const finish = () => {
          db.run('UPDATE Parcels SET status = ? WHERE parcel_id = ?', ['Paid', parcelId], () => {
            res.redirect('/parcels/' + parcelId);
          });
        };

        if (existing) {
          // update old record instead of creating
          db.run(
            'UPDATE Payments SET amount = ?, payment_status = ?, payment_method = ? WHERE payment_id = ?',
            [finalAmount, 'Paid', req.body.payment_method || 'COD', existing.payment_id],
            (errU) => {
              if (errU) return res.render('payment', { parcel, error: 'Failed to record payment' });
              finish();
            }
          );
        } else {
          Payment.create({
            amount: finalAmount,
            payment_method: req.body.payment_method || 'COD',
            payment_status: 'Completed',
            parcel_id: parcelId
          }, (err2, paymentId) => {
            if (err2) {
              return res.render('payment', { parcel, error: 'Failed to record payment' });
            }
            finish();
          });
        }
      });
    });
  }
};

module.exports = paymentController;
