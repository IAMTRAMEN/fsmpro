import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('📊 Creating database...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'fsm_app'}`);
    await connection.query(`USE ${process.env.DB_NAME || 'fsm_app'}`);

    console.log('📋 Creating tables...');
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('Technician', 'Manager', 'Owner', 'SuperAdmin') NOT NULL,
        avatar VARCHAR(500),
        address JSON,
        skills JSON,
        status ENUM('Available', 'Busy', 'Offline', 'OnRoute') DEFAULT 'Available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        location JSON NOT NULL,
        service_history JSON DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS providers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        service_type VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address VARCHAR(255) NOT NULL,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS work_orders (
        id VARCHAR(50) PRIMARY KEY,
        customer_id VARCHAR(50) NOT NULL,
        technician_ids JSON NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        service_type VARCHAR(100) NOT NULL,
        status ENUM('New', 'Assigned', 'In Progress', 'Completed') DEFAULT 'New',
        priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
        scheduled_start DATETIME NOT NULL,
        scheduled_end DATETIME NOT NULL,
        actual_start DATETIME,
        actual_end DATETIME,
        location JSON NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(50) PRIMARY KEY,
        work_order_id VARCHAR(50) NOT NULL,
        customer_id VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status ENUM('Pending', 'Paid', 'Overdue') DEFAULT 'Pending',
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS work_order_resources (
        id VARCHAR(50) PRIMARY KEY,
        work_order_id VARCHAR(50) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT,
        description TEXT,
        uploaded_by VARCHAR(255) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
        INDEX idx_work_order (work_order_id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS work_order_notes (
        id VARCHAR(50) PRIMARY KEY,
        work_order_id VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        author VARCHAR(255) NOT NULL,
        author_id VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
        INDEX idx_work_order (work_order_id)
      )
    `);

    console.log('🌱 Seeding mock data...');

    const users = [
      ['u1', 'Sarah Manager', 'sarah@fsm.com', 'password', 'Manager', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', null, null, 'Available'],
      ['u2', 'Mike Owner', 'mike@fsm.com', 'password', 'Owner', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', null, null, 'Available'],
      ['u3', 'Admin User', 'admin@fsm.com', 'password', 'SuperAdmin', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', null, null, 'Available'],
      ['t1', 'John Tech', 'john@fsm.com', 'password', 'Technician', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', null, JSON.stringify(['HVAC', 'Electrical']), 'Available'],
      ['t2', 'Lisa Fixit', 'lisa@fsm.com', 'password', 'Technician', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', null, JSON.stringify(['Plumbing', 'Gas']), 'Busy'],
      ['t3', 'Bob Builder', 'bob@fsm.com', 'password', 'Technician', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', null, JSON.stringify(['Carpentry', 'Roofing']), 'OnRoute'],
    ];

    for (const user of users) {
      await connection.query(
        'INSERT IGNORE INTO users (id, name, email, password, role, avatar, address, skills, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        user
      );
    }

    const customers = [
      ['c1', 'Acme Corp', 'contact@acme.com', '555-0101', JSON.stringify({ lat: 40.7128, lng: -74.0060, address: '123 Business Rd' }), JSON.stringify(['wo1'])],
      ['c2', 'Residential Tower A', 'manager@towera.com', '555-0102', JSON.stringify({ lat: 40.7580, lng: -73.9855, address: '456 Living St' }), JSON.stringify(['wo2'])],
      ['c3', 'Coffee Shop', 'owner@coffee.com', '555-0103', JSON.stringify({ lat: 40.7829, lng: -73.9654, address: '789 Brew Ave' }), JSON.stringify([])],
      ['c4', 'City Library', 'admin@library.org', '555-0104', JSON.stringify({ lat: 40.7484, lng: -73.9857, address: '321 Book Ln' }), JSON.stringify([])],
      ['c5', 'Gym Fit', 'fit@gym.com', '555-0105', JSON.stringify({ lat: 40.7295, lng: -73.9965, address: '654 Active Blvd' }), JSON.stringify([])],
    ];

    for (const customer of customers) {
      await connection.query(
        'INSERT IGNORE INTO customers (id, name, email, phone, location, service_history) VALUES (?, ?, ?, ?, ?, ?)',
        customer
      );
    }

    const providers = [
      ['p1', 'Global Parts Supply', 'Parts Supplier', 'sales@globalparts.com', '555-9999', 'Warehouse District', 'Active'],
      ['p2', 'Fast Logistics', 'Logistics', 'dispatch@fastlog.com', '555-8888', 'Airport Cargo', 'Active'],
    ];

    for (const provider of providers) {
      await connection.query(
        'INSERT IGNORE INTO providers (id, name, service_type, email, phone, address, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        provider
      );
    }

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    const yesterday = new Date(now.getTime() - 86400000);

    const workOrders = [
      ['wo1', 'c1', JSON.stringify(['t1']), 'HVAC Maintenance', 'Annual checkup of AC units', 'Maintenance', 'Completed', 'Medium', yesterday, yesterday, yesterday, yesterday, JSON.stringify({ lat: 40.7128, lng: -74.0060, address: '123 Business Rd' }), 150],
      ['wo2', 'c2', JSON.stringify(['t2']), 'Leaking Pipe', 'Emergency leak in basement', 'Repair', 'In Progress', 'Critical', now, tomorrow, now, null, JSON.stringify({ lat: 40.7580, lng: -73.9855, address: '456 Living St' }), 300],
      ['wo3', 'c3', JSON.stringify(['t3']), 'Roof Inspection', 'Quarterly roof inspection', 'Inspection', 'Assigned', 'Low', tomorrow, new Date(tomorrow.getTime() + 7200000), null, null, JSON.stringify({ lat: 40.7829, lng: -73.9654, address: '789 Brew Ave' }), 200],
    ];

    for (const wo of workOrders) {
      await connection.query(
        'INSERT IGNORE INTO work_orders (id, customer_id, technician_ids, title, description, service_type, status, priority, scheduled_start, scheduled_end, actual_start, actual_end, location, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        wo
      );
    }

    const invoices = [
      ['inv1', 'wo1', 'c1', 150, 'Paid', yesterday, yesterday],
      ['inv2', 'wo2', 'c2', 300, 'Pending', now, new Date(now.getTime() + 259200000)],
    ];

    for (const inv of invoices) {
      await connection.query(
        'INSERT IGNORE INTO invoices (id, work_order_id, customer_id, amount, status, issue_date, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        inv
      );
    }

    console.log('✅ Database setup complete!');
    await connection.end();
  } catch (error) {
    console.error('❌ Setup error:', error);
    process.exit(1);
  }
}

setupDatabase();
