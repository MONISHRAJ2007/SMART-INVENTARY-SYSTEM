const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const Inventory = require('../models/Inventory');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_inventory_db');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await Supplier.deleteMany();
    await Inventory.deleteMany();

    // 1. Create Default Users for Roles
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@inventory.com',
      password: 'password123',
      role: 'Admin',
    });

    const managerUser = await User.create({
      name: 'Store Manager',
      email: 'manager@inventory.com',
      password: 'password123',
      role: 'Store Manager',
    });

    // 2. Create Categories
    const catElectronics = await Category.create({ name: 'Electronics', description: 'Gadgets and hardware' });
    const catGroceries = await Category.create({ name: 'FMCG & Groceries', description: 'Packaged goods' });
    const catApparel = await Category.create({ name: 'Clothing', description: 'Wearables' });

    // 3. Create Suppliers
    const supplierA = await Supplier.create({
      name: 'Rajesh Kumar',
      company: 'Apex Tech Wholesale',
      email: 'apextech@supplier.com',
      phone: '+91 98765 11111',
      rating: 4.8,
    });

    const supplierB = await Supplier.create({
      name: 'Anish Sharma',
      company: 'Global FMCG Distributors',
      email: 'globalfmcg@supplier.com',
      phone: '+91 98765 22222',
      rating: 4.5,
    });

    // 4. Create Products
    const prod1 = await Product.create({
      name: 'Wireless Bluetooth Mouse',
      barcode: '8901234567890',
      category: catElectronics._id,
      supplier: supplierA._id,
      unitWeight: 250, // 250g per unit
      calibration: {
        unitWeight: 250,
        tolerance: 10,
        calibratedOn: new Date(),
        calibratedBy: adminUser._id,
        status: 'Success',
      },
      shelfNumber: 'Shelf A',
      costPrice: 450,
      sellingPrice: 799,
      gst: 18,
      stock: 20, // 20 units * 250g = 5000g total
      minStock: 5,
    });

    const prod2 = await Product.create({
      name: 'Packaged Green Tea (250g)',
      barcode: '8909876543210',
      category: catGroceries._id,
      supplier: supplierB._id,
      unitWeight: 250, // 250g per unit
      calibration: {
        unitWeight: 250,
        tolerance: 10,
        calibratedOn: new Date(),
        calibratedBy: adminUser._id,
        status: 'Success',
      },
      shelfNumber: 'Shelf B',
      costPrice: 120,
      sellingPrice: 199,
      gst: 5,
      stock: 14, // 14 units * 250g = 3500g total
      minStock: 5,
    });

    // 5. Initialize Shelves
    await Inventory.create({
      shelf: 'Shelf A',
      product: prod1._id,
      shelfCapacityGrams: 10000,
      actualShelfWeight: 5000,
      expectedShelfWeight: 5000,
      actualStock: 20,
      expectedStock: 20,
      weightDifference: 0,
      discrepancyStatus: 'Verified',
      filledPercentage: 50,
      status: 'OK',
    });

    await Inventory.create({
      shelf: 'Shelf B',
      product: prod2._id,
      shelfCapacityGrams: 10000,
      actualShelfWeight: 3500,
      expectedShelfWeight: 3500,
      actualStock: 14,
      expectedStock: 14,
      weightDifference: 0,
      discrepancyStatus: 'Verified',
      filledPercentage: 35,
      status: 'OK',
    });

    console.log('Database Seeded Successfully!');
    console.log('Default Credentials:');
    console.log('Admin Email: admin@inventory.com | Password: password123');
    console.log('Manager Email: manager@inventory.com | Password: password123');
    process.exit(0);
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

seedData();
