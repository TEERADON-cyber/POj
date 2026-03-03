const db = require('./Database');
const bcrypt = require('bcrypt');

async function seedAdmin() {
  try {
    // First, try to add role column if it doesn't exist (for migration)
    db.run(`ALTER TABLE Customers ADD COLUMN role TEXT DEFAULT 'customer'`, (err) => {
      if (err && err.message.includes('duplicate column')) {
        // Column already exists, that's fine
      } else if (err) {
        console.log('Note: Could not alter table (might already have role column):', err.message);
      }
      
      // Check if admin already exists
      db.get(`SELECT * FROM Customers WHERE email = 'admin@gmail.com'`, async (err, row) => {
        if (err) {
          console.error('Error checking admin:', err);
          return;
        }
        
        if (row) {
          console.log('✓ Admin account already exists at admin@gmail.com');
          return;
        }
        
        // Create admin account
        const password = '958813229';
        const hash = await bcrypt.hash(password, 10);
        
        db.run(
          `INSERT INTO Customers (customer_name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)`,
          ['Administrator', 'admin@gmail.com', hash, '0000000000', 'Admin Office', 'admin'],
          function(err) {
            if (err) {
              console.error('Error creating admin:', err);
            } else {
              console.log('✓ Admin account created');
              console.log('  Email: admin@gmail.com');
              console.log('  Password: 958813229');
            }
          }
        );
      });
    });
  } catch (err) {
    console.error('Seed error:', err);
  }
}

module.exports = seedAdmin;
