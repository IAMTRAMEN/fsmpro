import express, { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Real-time updates
const clients = new Set<Response>();
import { validateRequest, authenticateToken, requireRole } from './middleware.ts';
import {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  createWorkOrderSchema,
  updateWorkOrderSchema,
  createCustomerSchema,
  updateCustomerSchema,
  createInvoiceSchema,
  updateInvoiceSchema,
  createProviderSchema,
  updateProviderSchema,
  createWorkOrderResourceSchema,
  createWorkOrderNoteSchema,
  updateTechnicianLocationSchema
} from './validation.ts';
import { 
  compressImage, 
  compressToZip, 
  formatFileSize, 
  shouldCompressFile, 
  isCompressionSupported,
  type CompressionResult 
} from './server-utils/fileCompression.ts';

// Ensure upload directories exist
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'public', 'uploads', 'avatars');
const resourcesDir = path.join(__dirname, 'public', 'uploads', 'resources');

try {
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.mkdir(resourcesDir, { recursive: true });
} catch (error) {
  console.warn('Could not create uploads directory:', error);
}

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Server-Sent Events for real-time updates
app.get('/api/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  clients.add(res);

  req.on('close', () => {
    clients.delete(res);
  });
});

// Broadcast function for real-time updates
function broadcast(event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.write(message);
    } catch (e) {
      clients.delete(client);
    }
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Resource upload storage (allows all file types)
const resourceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public', 'uploads', 'resources'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resource-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const resourceUpload = multer({
  storage: resourceStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for resources
  fileFilter: (req, file, cb) => {
    // Allow all file types for resources
    cb(null, true);
  }
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fsm_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function deleteAvatarFile(avatarPath: string) {
  if (!avatarPath || avatarPath.startsWith('http') || avatarPath.includes('ui-avatars')) {
    return;
  }

  try {
    // Ensure the path is properly constructed
    const cleanPath = avatarPath.startsWith('/') ? avatarPath.substring(1) : avatarPath;
    const filePath = path.join(__dirname, 'public', cleanPath);
    await fs.unlink(filePath);
  } catch (error) {
    // Silently ignore errors when deleting avatar files
    console.warn(`Failed to delete avatar file: ${avatarPath}`, error);
  }
}

async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
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
        customer_id VARCHAR(50),
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
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(50) PRIMARY KEY,
        work_order_id VARCHAR(50) NOT NULL,
        customer_id VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2),
        line_items JSON,
        subtotal DECIMAL(10, 2),
        tax_amount DECIMAL(10, 2),
        total DECIMAL(10, 2),
        status ENUM('Pending', 'Paid', 'Overdue') DEFAULT 'Pending',
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS technician_locations (
        id VARCHAR(50) PRIMARY KEY,
        technician_id VARCHAR(50) NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        accuracy DECIMAL(10, 2),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_technician_timestamp (technician_id, timestamp DESC)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoice_settings (
        id VARCHAR(50) PRIMARY KEY,
        company_name VARCHAR(255),
        company_tax VARCHAR(100),
        company_address TEXT,
        company_phone VARCHAR(20),
        company_email VARCHAR(255),
        company_website VARCHAR(255),
        logo_url LONGTEXT,
        invoice_prefix VARCHAR(50),
        default_tax_rate DECIMAL(5, 2),
        payment_terms_days INT,
        language VARCHAR(10),
        footer_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS line_items JSON`);
    await connection.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2)`);
    await connection.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2)`);
    await connection.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total DECIMAL(10, 2)`);
    await connection.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT`);
    await connection.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS terms TEXT`);
    await connection.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2)`);
    await connection.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20)`);

    // Allow null customer_id in work_orders table
    await connection.query(`ALTER TABLE work_orders MODIFY COLUMN customer_id VARCHAR(50) NULL`);

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

    try {
      await connection.query(`UPDATE users SET avatar = NULL WHERE avatar LIKE 'data:%'`);
    } catch (e) {
      // Could not clear avatars
    }

    // Insert test data
    try {
      // Check if test data already exists
      const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
      if ((existingUsers as any)[0].count === 0) {
        // Insert test users with hashed passwords
        const hashedPassword = await bcrypt.hash('password', 10);
        await connection.query(`
          INSERT INTO users (id, name, email, password, role, avatar, address, skills, status) VALUES
          ('u1', 'Sarah Manager', 'sarah@fsm.com', ?, 'Manager', '', '{"lat":36.8065,"lng":10.1815,"address":"Tunis, Tunisia"}', '[]', 'Available'),
          ('u2', 'Mike Owner', 'mike@fsm.com', ?, 'Owner', '', '{"lat":36.8065,"lng":10.1815,"address":"Tunis, Tunisia"}', '[]', 'Available'),
          ('u3', 'Admin User', 'admin@fsm.com', ?, 'SuperAdmin', '', '{"lat":36.8065,"lng":10.1815,"address":"Tunis, Tunisia"}', '[]', 'Available'),
          ('t1', 'John Technician', 'john@fsm.com', ?, 'Technician', '', '{"lat":36.8065,"lng":10.1815,"address":"Tunis, Tunisia"}', '["Plumbing","Electrical"]', 'Available')
        `, [hashedPassword, hashedPassword, hashedPassword, hashedPassword]);

        // Insert test customers
        await connection.query(`
          INSERT INTO customers (id, name, email, phone, location, service_history) VALUES
          ('c1', 'Bob Customer', 'customer@example.com', '123-456-7890', '{"lat":36.8065,"lng":10.1815,"address":"Tunis, Tunisia"}', '[]')
        `);

        // Insert test work order
        await connection.query(`
          INSERT INTO work_orders (id, customer_id, technician_ids, title, description, service_type, status, priority, scheduled_start, scheduled_end, location, price) VALUES
          ('wo1', 'c1', '["t1"]', 'Fix Kitchen Sink', 'Kitchen sink is leaking', 'Plumbing', 'Completed', 'Medium', '2024-01-15 09:00:00', '2024-01-15 11:00:00', '{"lat":36.8065,"lng":10.1815,"address":"Tunis, Tunisia"}', 150.00)
        `);

        // Insert test invoice
        await connection.query(`
          INSERT INTO invoices (id, work_order_id, customer_id, line_items, subtotal, tax_amount, total, status, issue_date, due_date) VALUES
          ('inv1', 'wo1', 'c1', '[{"id":"item1","description":"Plumbing repair","quantity":1,"unitPrice":150,"taxRate":10}]', 150.00, 15.00, 165.00, 'Pending', '2024-01-15', '2024-02-14')
        `);

      }
    } catch (insertError) {
      console.error('❌ Test data insertion error:', insertError);
    }

    connection.release();
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  }
}

app.post('/api/upload/avatar', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    console.log('Avatar upload endpoint hit');
    console.log('File:', req.file);
    console.log('Body:', req.body);

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get token from FormData
    const token = (req.body as any).token;

    if (!token) {
      console.error('No token provided');
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    let user: any;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    const userId = user.id;

    if (!userId) {
      console.error('User not authenticated');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Delete old avatar file if it exists
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query('SELECT avatar FROM users WHERE id = ?', [userId]);
      connection.release();

      const user = (rows as any)[0];
      if (user && user.avatar) {
        await deleteAvatarFile(user.avatar);
      }
    } catch (dbError) {
      // Silently ignore errors when deleting avatar files
    }

    // Return full URL for cross-origin access
    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/avatars/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/login', validateRequest(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const connection = await pool.getConnection();

    const [rows] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    connection.release();

    if (Array.isArray(rows) && rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = (rows as any)[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const result: any = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token
    };

    if (user.role === 'Technician') {
      result.skills = user.skills ? JSON.parse(user.skills) : [];
      result.status = user.status || 'Available';
      result.location = user.address ? JSON.parse(user.address) : { lat: 0, lng: 0, address: '' };
    } else {
      result.address = user.address ? JSON.parse(user.address) : undefined;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/users', authenticateToken, requireRole(['Manager', 'Owner', 'SuperAdmin']), async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM users');
    connection.release();

    const users = (rows as any).map((u: any) => {
      const user: any = {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar
      };

      if (u.role === 'Technician') {
        user.skills = u.skills ? JSON.parse(u.skills) : [];
        user.status = u.status || 'Available';
        user.location = u.address ? JSON.parse(u.address) : { lat: 0, lng: 0, address: '' };
      } else {
        user.address = u.address ? JSON.parse(u.address) : undefined;
      }

      return user;
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/users', authenticateToken, requireRole(['Manager', 'Owner', 'SuperAdmin']), validateRequest(createUserSchema), async (req: Request, res: Response) => {
  try {
    const { id, name, email, password, role, avatar, address, skills, status } = req.body;
    const connection = await pool.getConnection();

    // Check if user with this email already exists
    const [existingEmail] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if ((existingEmail as any).length > 0) {
      connection.release();
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password || 'password', 10);

    await connection.query(
      'INSERT INTO users (id, name, email, password, role, avatar, address, skills, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id || `u${Date.now()}`,
        name,
        email,
        hashedPassword,
        role,
        avatar,
        address ? JSON.stringify(address) : null,
        skills ? JSON.stringify(skills) : null,
        status || 'Available'
      ]
    );

    connection.release();
    res.json({ id: id || `u${Date.now()}` });
  } catch (error) {
    // Handle specific validation errors
    if ((error as any).code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'A user with this email already exists' });
    } else {
      res.status(500).json({ error: (error as Error).message });
    }
  }
});

app.put('/api/users/:id', authenticateToken, validateRequest(updateUserSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const connection = await pool.getConnection();

    if (data.newPassword && data.newPassword.trim()) {
      // TEMPORARY: Allow password reset without old password validation for demo purposes
      // TODO: Revert to proper password validation after demo setup
      data.password = await bcrypt.hash(data.newPassword.trim(), 10);
      delete data.newPassword;
      delete data.oldPassword;
    }

    if ('avatar' in data) {
      const [rows] = await connection.query('SELECT avatar FROM users WHERE id = ?', [id]);
      const user = (rows as any)[0];
      if (user && user.avatar && user.avatar !== data.avatar) {
        // Delete the old avatar file when changing/removing avatar
        await deleteAvatarFile(user.avatar);
      }
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name) { updates.push('name = ?'); values.push(data.name); }
    if (data.email) { updates.push('email = ?'); values.push(data.email); }
    if (data.password) { updates.push('password = ?'); values.push(data.password); }
    if (data.role) { updates.push('role = ?'); values.push(data.role); }
    if ('avatar' in data) { updates.push('avatar = ?'); values.push(data.avatar); }
    if (data.address) { updates.push('address = ?'); values.push(JSON.stringify(data.address)); }
    if (data.location) { updates.push('address = ?'); values.push(JSON.stringify(data.location)); }
    if (data.skills) { updates.push('skills = ?'); values.push(JSON.stringify(data.skills)); }
    if (data.status) { updates.push('status = ?'); values.push(data.status); }

    if (updates.length > 0) {
      values.push(id);
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
      await connection.query(query, values);
    }

    const [rows] = await connection.query('SELECT * FROM users WHERE id = ?', [id]);
    connection.release();

    const user = (rows as any)[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result: any = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    };

    if (user.role === 'Technician') {
      result.skills = user.skills ? JSON.parse(user.skills) : [];
      result.status = user.status || 'Available';
      result.location = user.address ? JSON.parse(user.address) : { lat: 0, lng: 0, address: '' };
    } else {
      result.address = user.address ? JSON.parse(user.address) : undefined;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete('/api/users/:id', authenticateToken, requireRole(['Manager', 'Owner', 'SuperAdmin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    // Get user avatar before deleting
    const [rows] = await connection.query('SELECT avatar FROM users WHERE id = ?', [id]);
    const user = (rows as any)[0];

    // Delete the user
    await connection.query('DELETE FROM users WHERE id = ?', [id]);
    connection.release();

    // Delete avatar file after successful deletion
    if (user && user.avatar) {
      await deleteAvatarFile(user.avatar);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/customers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM customers');
    connection.release();

    const customers = (rows as any).map((c: any) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      location: JSON.parse(c.location),
      serviceHistory: JSON.parse(c.service_history)
    }));

    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/customers', authenticateToken, validateRequest(createCustomerSchema), async (req: Request, res: Response) => {
  try {
    const { id, name, email, phone, location, serviceHistory } = req.body;
    const connection = await pool.getConnection();

    // Check if customer with this email already exists
    const [existingEmail] = await connection.query('SELECT id FROM customers WHERE email = ?', [email]);
    if ((existingEmail as any).length > 0) {
      connection.release();
      return res.status(400).json({ error: 'A customer with this email already exists' });
    }

    // Check if customer with this name already exists
    const [existingName] = await connection.query('SELECT id FROM customers WHERE name = ?', [name]);
    if ((existingName as any).length > 0) {
      connection.release();
      return res.status(400).json({ error: 'A customer with this name already exists' });
    }

    const customerId = id || `c${Date.now()}`;
    await connection.query(
      'INSERT INTO customers (id, name, email, phone, location, service_history) VALUES (?, ?, ?, ?, ?, ?)',
      [customerId, name, email, phone, JSON.stringify(location), JSON.stringify(serviceHistory || [])]
    );

    const [rows] = await connection.query('SELECT * FROM customers WHERE id = ?', [customerId]);
    connection.release();

    const customer = (rows as any)[0];
    if (customer) {
      customer.location = JSON.parse(customer.location);
      customer.serviceHistory = JSON.parse(customer.service_history);
      delete customer.service_history;
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put('/api/customers/:id', authenticateToken, validateRequest(updateCustomerSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, location, serviceHistory } = req.body;
    const connection = await pool.getConnection();

    await connection.query(
      'UPDATE customers SET name = ?, email = ?, phone = ?, location = ?, service_history = ? WHERE id = ?',
      [name, email, phone, JSON.stringify(location), JSON.stringify(serviceHistory || []), id]
    );

    const [rows] = await connection.query('SELECT * FROM customers WHERE id = ?', [id]);
    connection.release();

    const customer = (rows as any)[0];
    if (customer) {
      customer.location = JSON.parse(customer.location);
      customer.serviceHistory = JSON.parse(customer.service_history);
      delete customer.service_history;
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete('/api/customers/:id', authenticateToken, requireRole(['Manager', 'Owner', 'SuperAdmin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM customers WHERE id = ?', [id]);
    connection.release();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/providers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM providers');
    connection.release();

    const providers = (rows as any).map((provider: any) => {
      provider.serviceType = provider.service_type;
      delete provider.service_type;
      return provider;
    });

    res.json(providers);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/providers', authenticateToken, requireRole(['Manager', 'Owner', 'SuperAdmin']), validateRequest(createProviderSchema), async (req: Request, res: Response) => {
  try {
    const { id, name, serviceType, email, phone, address, status } = req.body;
    const connection = await pool.getConnection();

    // Check if provider with this email already exists
    const [existingEmail] = await connection.query('SELECT id FROM providers WHERE email = ?', [email]);
    if ((existingEmail as any).length > 0) {
      connection.release();
      return res.status(400).json({ error: 'A provider with this email already exists' });
    }

    // Check if provider with this name already exists
    const [existingName] = await connection.query('SELECT id FROM providers WHERE name = ?', [name]);
    if ((existingName as any).length > 0) {
      connection.release();
      return res.status(400).json({ error: 'A provider with this name already exists' });
    }

    const providerId = id || `p${Date.now()}`;
    await connection.query(
      'INSERT INTO providers (id, name, service_type, email, phone, address, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [providerId, name, serviceType, email, phone, address, status || 'Active']
    );

    const [rows] = await connection.query('SELECT * FROM providers WHERE id = ?', [providerId]);
    connection.release();

    const provider = (rows as any)[0];
    if (provider) {
      provider.serviceType = provider.service_type;
      delete provider.service_type;
    }

    res.json(provider);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put('/api/providers/:id', authenticateToken, requireRole(['Manager', 'Owner', 'SuperAdmin']), validateRequest(updateProviderSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, serviceType, email, phone, address, status } = req.body;
    const connection = await pool.getConnection();

    await connection.query(
      'UPDATE providers SET name = ?, service_type = ?, email = ?, phone = ?, address = ?, status = ? WHERE id = ?',
      [name, serviceType, email, phone, address, status, id]
    );

    const [rows] = await connection.query('SELECT * FROM providers WHERE id = ?', [id]);
    connection.release();
    const provider = (rows as any)[0];
    if (provider) {
      provider.serviceType = provider.service_type;
      delete provider.service_type;
    }
    res.json(provider);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete('/api/providers/:id', authenticateToken, requireRole(['Manager', 'Owner', 'SuperAdmin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM providers WHERE id = ?', [id]);
    connection.release();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/work-orders', authenticateToken, async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM work_orders');

    const workOrders = await Promise.all((rows as any).map(async (wo: any) => {
      const [resourceRows] = await connection.query(
        'SELECT id, file_name, file_type, file_path as url, file_size as size, description, uploaded_by, uploaded_at FROM work_order_resources WHERE work_order_id = ?',
        [wo.id]
      );

      const [noteRows] = await connection.query(
        'SELECT id, content, author, author_id, timestamp FROM work_order_notes WHERE work_order_id = ? ORDER BY timestamp DESC',
        [wo.id]
      );

      const resources = (resourceRows as any).map((r: any) => ({
        id: r.id,
        fileName: r.file_name,
        fileType: r.file_type,
        url: r.url,
        size: r.size,
        description: r.description,
        uploadedBy: r.uploaded_by,
        uploadedAt: r.uploaded_at
      }));

      const notes = (noteRows as any).map((n: any) => ({
        id: n.id,
        content: n.content,
        author: n.author,
        authorId: n.author_id,
        timestamp: n.timestamp
      }));

      return {
        id: wo.id,
        customerId: wo.customer_id,
        technicianIds: JSON.parse(wo.technician_ids),
        title: wo.title,
        description: wo.description,
        serviceType: wo.service_type,
        status: wo.status,
        priority: wo.priority,
        scheduledStart: wo.scheduled_start,
        scheduledEnd: wo.scheduled_end,
        actualStart: wo.actual_start,
        actualEnd: wo.actual_end,
        location: JSON.parse(wo.location),
        price: wo.price,
        customerName: wo.customer_name,
        resources,
        notes
      };
    }));

    connection.release();
    res.json(workOrders);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/work-orders', authenticateToken, validateRequest(createWorkOrderSchema), async (req: Request, res: Response) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id, customerId, technicianIds, title, description, serviceType, status, priority, scheduledStart, scheduledEnd, location, price } = req.body;
    const workOrderId = id || `wo${Date.now()}`;

    // Insert work order
    await connection.query(
      'INSERT INTO work_orders (id, customer_id, technician_ids, title, description, service_type, status, priority, scheduled_start, scheduled_end, location, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [workOrderId, customerId || null, JSON.stringify(technicianIds), title, description, serviceType, status || 'New', priority || 'Medium', scheduledStart, scheduledEnd, JSON.stringify(location), price]
    );

    // Auto-generate invoice only if customerId is provided
    if (customerId) {
      const invoiceId = `inv${Date.now()}`;
      const lineItems = [{
        id: 'item1',
        description: title || 'Service',
        quantity: 1,
        unitPrice: price,
        taxRate: 0
      }];
      const subtotal = price;
      const taxAmount = 0;
      const total = price;
      const issueDate = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      await connection.query(
        'INSERT INTO invoices (id, work_order_id, customer_id, line_items, subtotal, tax_amount, total, status, issue_date, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [invoiceId, workOrderId, customerId, JSON.stringify(lineItems), subtotal, taxAmount, total, 'Pending', issueDate, dueDate]
      );
    }

    await connection.commit();

    // Broadcast real-time update
    const [createdWorkOrder] = await connection.query('SELECT * FROM work_orders WHERE id = ?', [workOrderId]);
    if ((createdWorkOrder as any).length > 0) {
      const wo = (createdWorkOrder as any)[0];
      wo.technicianIds = JSON.parse(wo.technician_ids);
      wo.scheduledStart = wo.scheduled_start;
      wo.scheduledEnd = wo.scheduled_end;
      wo.actualStart = wo.actual_start;
      wo.actualEnd = wo.actual_end;
      wo.customerId = wo.customer_id;
      wo.serviceType = wo.service_type;
      wo.location = JSON.parse(wo.location);
      broadcast('work-order-created', wo);
    }

    const response: any = {
      workOrderId,
      message: customerId ? 'Work order and invoice created successfully' : 'Work order created successfully'
    };

    if (customerId) {
      response.invoiceId = `inv${Date.now()}`;
    }

    res.json(response);
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: (error as Error).message });
  } finally {
    connection.release();
  }
});

app.put('/api/work-orders/:id', authenticateToken, validateRequest(updateWorkOrderSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { customerId, technicianIds, title, description, serviceType, status, priority, scheduledStart, scheduledEnd, actualStart, actualEnd, location, price } = req.body;
    const connection = await pool.getConnection();

    const updates: string[] = [];
    const values: any[] = [];

    if (customerId !== undefined) {
      updates.push('customer_id = ?');
      values.push(customerId);
    }
    if (technicianIds !== undefined) {
      updates.push('technician_ids = ?');
      values.push(JSON.stringify(technicianIds));
    }
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (serviceType !== undefined) {
      updates.push('service_type = ?');
      values.push(serviceType);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (scheduledStart !== undefined) {
      updates.push('scheduled_start = ?');
      values.push(scheduledStart);
    }
    if (scheduledEnd !== undefined) {
      updates.push('scheduled_end = ?');
      values.push(scheduledEnd);
    }
    if (actualStart !== undefined) {
      updates.push('actual_start = ?');
      values.push(actualStart);
    }
    if (actualEnd !== undefined) {
      updates.push('actual_end = ?');
      values.push(actualEnd);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      values.push(JSON.stringify(location));
    }
    if (price !== undefined) {
      updates.push('price = ?');
      values.push(price);
    }

    if (updates.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    await connection.query(
      `UPDATE work_orders SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [rows] = await connection.query('SELECT * FROM work_orders WHERE id = ?', [id]);
    connection.release();

    const wo = (rows as any)[0];
    if (wo) {
      wo.technicianIds = JSON.parse(wo.technician_ids);
      wo.scheduledStart = wo.scheduled_start;
      wo.scheduledEnd = wo.scheduled_end;
      wo.actualStart = wo.actual_start;
      wo.actualEnd = wo.actual_end;
      wo.customerId = wo.customer_id;
      wo.serviceType = wo.service_type;
      wo.location = JSON.parse(wo.location);
    }

    // Broadcast real-time update
    broadcast('work-order-updated', wo);

    res.json(wo);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete('/api/work-orders/:id', authenticateToken, requireRole(['Manager', 'Owner', 'SuperAdmin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM work_orders WHERE id = ?', [id]);
    connection.release();

    // Broadcast real-time update
    broadcast('work-order-deleted', { id });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/work-orders/:id/resources', authenticateToken, resourceUpload.single('file'), async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { id: workOrderId } = req.params;
    const { description } = req.body;
    const file = req.file;
    const user = (req as any).user; // Extract user from JWT token
    
    console.log('🚀 Enhanced upload request started:', { 
      workOrderId, 
      description: description || 'No description',
      file: file ? { 
        originalname: file.originalname, 
        mimetype: file.mimetype, 
        size: file.size,
        sizeFormatted: formatFileSize(file.size)
      } : 'No file',
      user: user ? { id: user.id, email: user.email, role: user.role } : 'No user'
    });
    
    // Enhanced file validation with user-friendly messages
    if (!file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please select a file to upload.',
        code: 'NO_FILE'
      });
    }

    // File size validation with user-friendly messages
    const maxSize = 25 * 1024 * 1024; // 25MB max
    if (file.size > maxSize) {
      return res.status(400).json({ 
        error: `File too large: ${formatFileSize(file.size)}`,
        message: `Your file is ${formatFileSize(file.size)}. Maximum allowed size is ${formatFileSize(maxSize)}. Please choose a smaller file or compress it before uploading.`,
        code: 'FILE_TOO_LARGE',
        maxSize: formatFileSize(maxSize),
        fileSize: formatFileSize(file.size)
      });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/csv',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        error: `Unsupported file type: ${file.mimetype}`,
        message: `File type "${file.mimetype}" is not supported. Please upload images (JPEG, PNG, GIF, WebP), documents (PDF, Word, Excel), or compressed files (ZIP, RAR, 7Z).`,
        code: 'UNSUPPORTED_FILE_TYPE',
        allowedTypes: allowedTypes
      });
    }

    // Get accurate user information from JWT token
    const uploadedBy = user ? `${user.name} (${user.role})` : 'Unknown User';
    const userId = user?.id || 'unknown';

    console.log('📋 User validation passed:', { uploadedBy, userId });

    // Check if work order exists
    const connection = await pool.getConnection();
    const [workOrderRows] = await connection.query('SELECT id FROM work_orders WHERE id = ?', [workOrderId]);
    
    if ((workOrderRows as any).length === 0) {
      connection.release();
      return res.status(400).json({ 
        error: `Work order with ID ${workOrderId} not found`,
        message: 'The specified work order does not exist. Please check the work order ID and try again.',
        code: 'WORK_ORDER_NOT_FOUND',
        workOrderId
      });
    }

    console.log('✅ Work order validation passed');

    // Handle file compression if needed
    let finalFilePath = path.join(__dirname, 'public', 'uploads', 'resources', file.filename);
    let finalFileSize = file.size;
    let wasCompressed = false;
    let compressionInfo: CompressionResult | null = null;

    if (shouldCompressFile(file.mimetype, file.size)) {
      console.log('🗜️ File compression recommended:', { 
        mimetype: file.mimetype, 
        size: formatFileSize(file.size) 
      });

      try {
        // For images, use sharp compression
        if (isCompressionSupported(file.mimetype)) {
          const compressedFilename = `compressed_${file.filename}`;
          const compressedPath = path.join(__dirname, 'public', 'uploads', 'resources', compressedFilename);
          
          compressionInfo = await compressImage(file.path, compressedPath, {
            quality: 80,
            width: 1920,
            height: 1080,
            maxSizeMB: 5
          });

          if (compressionInfo.success && compressionInfo.compressionRatio && compressionInfo.compressionRatio < 0.8) {
            finalFilePath = compressedPath;
            finalFileSize = compressionInfo.compressedSize || file.size;
            wasCompressed = true;
            
            // Clean up original file
            try {
              await fs.unlink(file.path);
            } catch (cleanupError) {
              console.warn('⚠️ Failed to clean up original file:', cleanupError);
            }
            
            console.log('🖼️ Image compression successful:', {
              originalSize: formatFileSize(compressionInfo.originalSize),
              compressedSize: formatFileSize(compressionInfo.compressedSize!),
              compressionRatio: `${((1 - compressionInfo.compressionRatio!) * 100).toFixed(1)}%`
            });
          } else {
            console.log('ℹ️ Compression not beneficial, keeping original file');
          }
        }
        // For large non-image files, we could implement ZIP compression here
        // For now, we'll skip ZIP compression for single files
        
      } catch (compressionError) {
        console.warn('⚠️ Compression failed, using original file:', compressionError);
        // Continue with original file if compression fails
      }
    }

    const resourceId = `res${Date.now()}`;
    const filePath = `uploads/resources/${path.basename(finalFilePath)}`;
    
    // Insert into database
    await connection.query(
      'INSERT INTO work_order_resources (id, work_order_id, file_name, file_type, file_path, file_size, description, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [resourceId, workOrderId, file.originalname, file.mimetype, filePath, finalFileSize, description || null, uploadedBy]
    );
    connection.release();

    const processingTime = Date.now() - startTime;

    const resource = {
      id: resourceId,
      workOrderId: workOrderId,
      fileName: file.originalname,
      fileType: file.mimetype,
      filePath: filePath,
      url: `${req.protocol}://${req.get('host')}/${filePath}`,
      fileSize: finalFileSize,
      fileSizeFormatted: formatFileSize(finalFileSize),
      originalFileSize: wasCompressed ? formatFileSize(file.size) : null,
      description: description || null,
      uploadedBy: uploadedBy,
      uploadedById: userId,
      uploadedAt: new Date().toISOString(),
      compression: wasCompressed ? {
        wasCompressed: true,
        compressionRatio: compressionInfo?.compressionRatio || 1,
        sizeReduction: formatFileSize(file.size - finalFileSize)
      } : {
        wasCompressed: false
      }
    };

    console.log('✅ Upload successful:', {
      resourceId,
      fileName: file.originalname,
      fileSize: formatFileSize(finalFileSize),
      processingTime: `${processingTime}ms`,
      compression: wasCompressed
    });

    res.json(resource);
  }
  catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Upload failed after', processingTime + 'ms:', error);
    
    // Enhanced error handling with user-friendly messages
    if ((error as any).code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        error: 'Work order not found',
        message: 'The specified work order could not be found. Please verify the work order ID and try again.',
        code: 'WORK_ORDER_NOT_FOUND'
      });
    }
    
    if ((error as any).code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: 'Resource already exists',
        message: 'A resource with this ID already exists. Please try uploading again.',
        code: 'RESOURCE_EXISTS'
      });
    }
    
    if ((error as any).code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File size exceeds limit',
        message: 'The uploaded file is too large. Maximum file size is 25MB.',
        code: 'FILE_SIZE_LIMIT',
        maxSize: '25MB'
      });
    }

    // Handle multer errors
    if ((error as any).message?.includes('File too large')) {
      return res.status(400).json({ 
        error: 'File too large',
        message: 'The uploaded file exceeds the maximum size limit of 25MB.',
        code: 'FILE_TOO_LARGE'
      });
    }
    
    // Handle disk space errors
    if ((error as any).code === 'ENOSPC') {
      return res.status(500).json({ 
        error: 'Storage space insufficient',
        message: 'There is not enough storage space to save the uploaded file.',
        code: 'INSUFFICIENT_SPACE'
      });
    }
    
    // Generic error response
    res.status(500).json({ 
      error: 'Upload failed',
      message: 'An unexpected error occurred while uploading the file. Please try again.',
      code: 'UPLOAD_FAILED',
      processingTime: `${processingTime}ms`
    });
  }
});

app.delete('/api/work-orders/:id/resources/:resourceId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id, resourceId } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM work_order_resources WHERE id = ? AND work_order_id = ?', [resourceId, id]);
    connection.release();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/work-orders/:id/notes', authenticateToken, validateRequest(createWorkOrderNoteSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, author, authorId } = req.body;
    const connection = await pool.getConnection();

    const noteId = `note${Date.now()}`;
    await connection.query(
      'INSERT INTO work_order_notes (id, work_order_id, content, author, author_id) VALUES (?, ?, ?, ?, ?)',
      [noteId, id, content, author, authorId]
    );

    connection.release();
    res.json({ id: noteId, success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete('/api/work-orders/:id/notes/:noteId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id, noteId } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM work_order_notes WHERE id = ? AND work_order_id = ?', [noteId, id]);
    connection.release();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/invoices', authenticateToken, async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM invoices');
    connection.release();

    const invoices = (rows as any).map((inv: any) => ({
      id: inv.id,
      workOrderId: inv.work_order_id,
      customerId: inv.customer_id,
      amount: inv.amount,
      lineItems: inv.line_items ? JSON.parse(inv.line_items) : [],
      subtotal: inv.subtotal,
      taxAmount: inv.tax_amount,
      total: inv.total,
      status: inv.status,
      issueDate: inv.issue_date,
      dueDate: inv.due_date,
      notes: inv.notes,
      terms: inv.terms,
      discount: inv.discount,
      discountType: inv.discount_type
    }));

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/invoices', authenticateToken, validateRequest(createInvoiceSchema), async (req: Request, res: Response) => {
  try {
    const { id, workOrderId, customerId, amount, lineItems, subtotal, taxAmount, total, status, issueDate, dueDate, notes } = req.body;
    const connection = await pool.getConnection();

    await connection.query(
      'INSERT INTO invoices (id, work_order_id, customer_id, amount, line_items, subtotal, tax_amount, total, status, issue_date, due_date, notes, terms, discount, discount_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id || `inv${Date.now()}`,
        workOrderId,
        customerId,
        amount,
        lineItems ? JSON.stringify(lineItems) : null,
        subtotal,
        taxAmount,
        total,
        status || 'Pending',
        issueDate,
        dueDate,
        notes || null,
        req.body.terms || null,
        req.body.discount || null,
        req.body.discountType || null
      ]
    );

    connection.release();
    res.json({ id: id || `inv${Date.now()}` });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put('/api/invoices/:id', authenticateToken, validateRequest(updateInvoiceSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const connection = await pool.getConnection();

    const updates: string[] = [];
    const values: any[] = [];

    if (body.amount !== undefined) {
      updates.push('amount = ?');
      values.push(body.amount);
    }
    if (body.lineItems !== undefined) {
      updates.push('line_items = ?');
      values.push(JSON.stringify(body.lineItems));
    }
    if (body.subtotal !== undefined) {
      updates.push('subtotal = ?');
      values.push(body.subtotal);
    }
    if (body.taxAmount !== undefined) {
      updates.push('tax_amount = ?');
      values.push(body.taxAmount);
    }
    if (body.total !== undefined) {
      updates.push('total = ?');
      values.push(body.total);
    }
    if (body.status !== undefined) {
      updates.push('status = ?');
      values.push(body.status);
    }
    if (body.issueDate !== undefined) {
      updates.push('issue_date = ?');
      values.push(body.issueDate);
    }
    if (body.dueDate !== undefined) {
      updates.push('due_date = ?');
      values.push(body.dueDate);
    }
    if (body.notes !== undefined) {
      updates.push('notes = ?');
      values.push(body.notes);
    }
    if (body.terms !== undefined) {
      updates.push('terms = ?');
      values.push(body.terms);
    }
    if (body.discount !== undefined) {
      updates.push('discount = ?');
      values.push(body.discount);
    }
    if (body.discountType !== undefined) {
      updates.push('discount_type = ?');
      values.push(body.discountType);
    }

    if (updates.length > 0) {
      values.push(id);
      await connection.query(
        `UPDATE invoices SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const [rows] = await connection.query('SELECT * FROM invoices WHERE id = ?', [id]);
    connection.release();

    const invoice = (rows as any)[0];
    if (invoice) {
      const result = {
        id: invoice.id,
        workOrderId: invoice.work_order_id,
        customerId: invoice.customer_id,
        amount: invoice.amount,
        lineItems: invoice.line_items ? JSON.parse(invoice.line_items) : [],
        subtotal: invoice.subtotal,
        taxAmount: invoice.tax_amount,
        total: invoice.total,
        status: invoice.status,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        notes: invoice.notes,
        terms: invoice.terms,
        discount: invoice.discount,
        discountType: invoice.discount_type
      };
      res.json(result);
    } else {
      res.status(404).json({ error: 'Invoice not found' });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete('/api/invoices/:id', authenticateToken, requireRole(['Manager', 'Owner', 'SuperAdmin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM invoices WHERE id = ?', [id]);
    connection.release();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/invoice-settings', authenticateToken, async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM invoice_settings LIMIT 1');
    connection.release();

    const settings = (rows as any)[0];
    if (settings) {
      res.json({
        id: settings.id,
        companyName: settings.company_name,
        companyTax: settings.company_tax,
        companyAddress: settings.company_address,
        companyPhone: settings.company_phone,
        companyEmail: settings.company_email,
        companyWebsite: settings.company_website,
        logoUrl: settings.logo_url,
        invoicePrefix: settings.invoice_prefix,
        defaultTaxRate: settings.default_tax_rate,
        paymentTermsDays: settings.payment_terms_days,
        language: settings.language,
        footerText: settings.footer_text
      });
    } else {
      res.json({
        id: 'default',
        companyName: '',
        companyTax: '',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        companyWebsite: '',
        logoUrl: '',
        invoicePrefix: 'INV',
        defaultTaxRate: 0,
        paymentTermsDays: 30,
        language: 'en',
        footerText: ''
      });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put('/api/invoice-settings', authenticateToken, requireRole(['Manager', 'Owner', 'SuperAdmin']), async (req: Request, res: Response) => {
  try {
    const { companyName, companyTax, companyAddress, companyPhone, companyEmail, companyWebsite, logoUrl, invoicePrefix, defaultTaxRate, paymentTermsDays, language, footerText } = req.body;
    const connection = await pool.getConnection();

    const [existingRows] = await connection.query('SELECT id FROM invoice_settings LIMIT 1');
    const settingsId = (existingRows as any).length > 0 ? (existingRows as any)[0].id : `settings${Date.now()}`;

    if ((existingRows as any).length > 0) {
      await connection.query(
        'UPDATE invoice_settings SET company_name = ?, company_tax = ?, company_address = ?, company_phone = ?, company_email = ?, company_website = ?, logo_url = ?, invoice_prefix = ?, default_tax_rate = ?, payment_terms_days = ?, language = ?, footer_text = ? WHERE id = ?',
        [companyName, companyTax, companyAddress, companyPhone, companyEmail, companyWebsite, logoUrl, invoicePrefix, defaultTaxRate, paymentTermsDays, language, footerText, settingsId]
      );
    } else {
      await connection.query(
        'INSERT INTO invoice_settings (id, company_name, company_tax, company_address, company_phone, company_email, company_website, logo_url, invoice_prefix, default_tax_rate, payment_terms_days, language, footer_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [settingsId, companyName, companyTax, companyAddress, companyPhone, companyEmail, companyWebsite, logoUrl, invoicePrefix, defaultTaxRate, paymentTermsDays, language, footerText]
      );
    }

    const [rows] = await connection.query('SELECT * FROM invoice_settings WHERE id = ?', [settingsId]);
    connection.release();

    const settings = (rows as any)[0];
    if (settings) {
      res.json({
        id: settings.id,
        companyName: settings.company_name,
        companyTax: settings.company_tax,
        companyAddress: settings.company_address,
        companyPhone: settings.company_phone,
        companyEmail: settings.company_email,
        companyWebsite: settings.company_website,
        logoUrl: settings.logo_url,
        invoicePrefix: settings.invoice_prefix,
        defaultTaxRate: settings.default_tax_rate,
        paymentTermsDays: settings.payment_terms_days,
        language: settings.language,
        footerText: settings.footer_text
      });
    } else {
      res.status(500).json({ error: 'Failed to save settings' });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/technicians/:id/location', authenticateToken, validateRequest(updateTechnicianLocationSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, accuracy } = req.body;
    const connection = await pool.getConnection();

    const locationId = `loc${Date.now()}`;
    await connection.query(
      'INSERT INTO technician_locations (id, technician_id, latitude, longitude, accuracy) VALUES (?, ?, ?, ?, ?)',
      [locationId, id, latitude, longitude, accuracy || null]
    );

    await connection.query(
      'UPDATE users SET address = ? WHERE id = ? AND role = ?',
      [JSON.stringify({ lat: latitude, lng: longitude, address: '' }), id, 'Technician']
    );

    connection.release();
    res.json({ id: locationId, success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/technicians/locations/live', authenticateToken, async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();

    const [rows] = await connection.query(`
      SELECT DISTINCT 
        u.id,
        u.name,
        u.avatar,
        u.role,
        u.status,
        u.skills,
        tl.latitude,
        tl.longitude,
        tl.accuracy,
        tl.timestamp,
        ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY tl.timestamp DESC) as rn
      FROM users u
      LEFT JOIN technician_locations tl ON u.id = tl.technician_id
      WHERE u.role = 'Technician'
    `);

    connection.release();

    const technicians = (rows as any)
      .filter((row: any) => row.rn === 1 || row.rn === null)
      .map((tech: any) => ({
        id: tech.id,
        name: tech.name,
        avatar: tech.avatar,
        role: tech.role,
        status: tech.status || 'Available',
        skills: tech.skills ? JSON.parse(tech.skills) : [],
        location: {
          lat: tech.latitude || 40.7128,
          lng: tech.longitude || -74.0060,
          address: ''
        },
        accuracy: tech.accuracy,
        lastUpdate: tech.timestamp
      }));

    res.json(technicians);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Overdue invoice detection job
const checkOverdueInvoices = async () => {
  const connection = await pool.getConnection();
  try {
    const today = new Date().toISOString().split('T')[0];
    await connection.query(
      "UPDATE invoices SET status = 'Overdue' WHERE status = 'Pending' AND due_date < ?",
      [today]
    );

    const [result] = await connection.query(
      "SELECT COUNT(*) as count FROM invoices WHERE status = 'Overdue'"
    );
  } catch (error) {
    console.error('❌ Overdue check error:', error);
  } finally {
    connection.release();
  }
};

// Run overdue check every hour
setInterval(checkOverdueInvoices, 60 * 60 * 1000);

// Initial overdue check on startup
setTimeout(checkOverdueInvoices, 5000);

if (process.env.NODE_ENV === 'production') {
  app.get('*', (req: Request, res: Response) => {
    const distPath = path.join(__dirname, 'dist', 'index.html');
    res.sendFile(distPath, (err) => {
      if (err) {
        res.status(404).json({ error: 'Not found' });
      }
    });
  });
}

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await initializeDatabase();
});
