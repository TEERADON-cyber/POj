-- Schema for Postal Delivery System
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Customers (
  customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  role TEXT DEFAULT 'customer'
);

CREATE TABLE IF NOT EXISTS Parcels (
  parcel_id INTEGER PRIMARY KEY AUTOINCREMENT,
  tracking_number TEXT NOT NULL UNIQUE,
  sender_id INTEGER NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT,
  receiver_address TEXT,
  weight REAL DEFAULT 0,
  size TEXT,
  shipping_cost REAL DEFAULT 0,
  status TEXT DEFAULT 'Created',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (sender_id) REFERENCES Customers(customer_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Payments (
  payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_date TEXT DEFAULT (datetime('now')),
  amount REAL NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'Pending',
  parcel_id INTEGER UNIQUE,
  FOREIGN KEY (parcel_id) REFERENCES Parcels(parcel_id) ON DELETE CASCADE
);
