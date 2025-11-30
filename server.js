"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const promise_1 = __importDefault(require("mysql2/promise"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs/promises"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.API_PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
const pool = promise_1.default.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fsm_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Ensure upload directories exist
const uploadsDir = path_1.default.join(__dirname, 'public', 'uploads', 'avatars');
const resourcesDir = path_1.default.join(__dirname, 'public', 'uploads', 'resources');
try {
    fs_1.default.mkdir(uploadsDir, { recursive: true });
    fs_1.default.mkdir(resourcesDir, { recursive: true });
} catch (error) {
    console.warn('Could not create uploads directory:', error);
}

const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});

const upload = multer_1.default({
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

const resourceStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, resourcesDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'resource-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});

const resourceUpload = multer_1.default({
    storage: resourceStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for resources
    fileFilter: (req, file, cb) => {
        // Allow all file types for resources
        cb(null, true);
    }
});
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
        await connection.query(`
          CREATE TABLE IF NOT EXISTS work_order_resources (
            id VARCHAR(50) PRIMARY KEY,
            work_order_id VARCHAR(50) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_type VARCHAR(100) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            file_size INT,
            description TEXT,
            uploaded_by VARCHAR(100) NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
          )
        `);
        connection.release();
        console.log('✅ Database tables initialized');
    }
    catch (error) {
        console.error('❌ Database initialization error:', error);
        process.exit(1);
    }
}
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
        connection.release();
        if (Array.isArray(rows) && rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = rows[0];
        const result = {
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
        }
        else {
            result.address = user.address ? JSON.parse(user.address) : undefined;
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/users', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM users');
        connection.release();
        const users = rows.map((u) => {
            const user = {
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
            }
            else {
                user.address = u.address ? JSON.parse(u.address) : undefined;
            }
            return user;
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/users', async (req, res) => {
    try {
        const { id, name, email, password, role, avatar, address, skills, status } = req.body;
        const connection = await pool.getConnection();

        // Check if user with this email already exists
        const [existingEmail] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            connection.release();
            return res.status(400).json({ error: 'A user with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password || 'password', 10);

        await connection.query('INSERT INTO users (id, name, email, password, role, avatar, address, skills, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            id || `u${Date.now()}`,
            name,
            email,
            hashedPassword,
            role,
            avatar,
            address ? JSON.stringify(address) : null,
            skills ? JSON.stringify(skills) : null,
            status || 'Available'
        ]);

        connection.release();
        res.json({ id: id || `u${Date.now()}` });
    }
    catch (error) {
        // Handle specific validation errors
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'A user with this email already exists' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});
app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const connection = await pool.getConnection();
        if (data.newPassword) {
            const [rows] = await connection.query('SELECT password FROM users WHERE id = ?', [id]);
            const current = rows[0];
            if (!current || current.password !== data.oldPassword) {
                connection.release();
                return res.status(400).json({ error: 'Incorrect old password' });
            }
            data.password = data.newPassword;
            delete data.newPassword;
            delete data.oldPassword;
        }
        const updates = [];
        const values = [];
        if (data.name) {
            updates.push('name = ?');
            values.push(data.name);
        }
        if (data.email) {
            updates.push('email = ?');
            values.push(data.email);
        }
        if (data.password) {
            updates.push('password = ?');
            values.push(data.password);
        }
        if (data.role) {
            updates.push('role = ?');
            values.push(data.role);
        }
        if (data.avatar) {
            updates.push('avatar = ?');
            values.push(data.avatar);
        }
        if (data.address) {
            updates.push('address = ?');
            values.push(JSON.stringify(data.address));
        }
        if (data.location) {
            updates.push('address = ?');
            values.push(JSON.stringify(data.location));
        }
        if (data.skills) {
            updates.push('skills = ?');
            values.push(JSON.stringify(data.skills));
        }
        if (data.status) {
            updates.push('status = ?');
            values.push(data.status);
        }
        if (updates.length > 0) {
            values.push(id);
            const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
            await connection.query(query, values);
        }
        const [rows] = await connection.query('SELECT * FROM users WHERE id = ?', [id]);
        connection.release();
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const result = {
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
        }
        else {
            result.address = user.address ? JSON.parse(user.address) : undefined;
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
    });
    
    // Avatar upload endpoint
    app.post('/api/upload/avatar', upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'token', maxCount: 1 }]), async (req, res) => {
        try {
            console.log('Avatar upload endpoint hit');
            console.log('Files:', req.files);
            console.log('Body:', req.body);
    
            const files = req.files;
            const avatarFile = files['avatar']?.[0];
    
            if (!avatarFile) {
                console.error('No file uploaded');
                return res.status(400).json({ error: 'No file uploaded' });
            }
    
            // Get token from FormData
            const token = req.body.token;
    
            if (!token) {
                console.error('No token provided');
                return res.status(401).json({ error: 'Access token required' });
            }
    
            // For simplicity, no JWT verification in server.js
            // In production, add JWT verification
    
            // Return full URL for cross-origin access
            const protocol = req.protocol;
            const host = req.get('host');
            const fileUrl = `${protocol}://${host}/uploads/avatars/${avatarFile.filename}`;
            res.json({ url: fileUrl });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        await connection.query('DELETE FROM users WHERE id = ?', [id]);
        connection.release();
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/customers', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM customers');
        connection.release();
        const customers = rows.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            location: JSON.parse(c.location),
            serviceHistory: JSON.parse(c.service_history)
        }));
        res.json(customers);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/customers', async (req, res) => {
    try {
        const { id, name, email, phone, location, serviceHistory } = req.body;
        const connection = await pool.getConnection();

        // Check if customer with this email already exists
        const [existingEmail] = await connection.query('SELECT id FROM customers WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            connection.release();
            return res.status(400).json({ error: 'A customer with this email already exists' });
        }

        // Check if customer with this name already exists
        const [existingName] = await connection.query('SELECT id FROM customers WHERE name = ?', [name]);
        if (existingName.length > 0) {
            connection.release();
            return res.status(400).json({ error: 'A customer with this name already exists' });
        }

        const customerId = id || `c${Date.now()}`;
        await connection.query('INSERT INTO customers (id, name, email, phone, location, service_history) VALUES (?, ?, ?, ?, ?, ?)', [customerId, name, email, phone, JSON.stringify(location), JSON.stringify(serviceHistory || [])]);

        const [rows] = await connection.query('SELECT * FROM customers WHERE id = ?', [customerId]);
        connection.release();

        const customer = rows[0];
        if (customer) {
            customer.location = JSON.parse(customer.location);
            customer.serviceHistory = JSON.parse(customer.service_history);
            delete customer.service_history;
        }

        res.json(customer);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.put('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, location, serviceHistory } = req.body;
        const connection = await pool.getConnection();
        await connection.query('UPDATE customers SET name = ?, email = ?, phone = ?, location = ?, service_history = ? WHERE id = ?', [name, email, phone, JSON.stringify(location), JSON.stringify(serviceHistory || []), id]);
        const [rows] = await connection.query('SELECT * FROM customers WHERE id = ?', [id]);
        connection.release();
        const customer = rows[0];
        if (customer) {
            customer.location = JSON.parse(customer.location);
            customer.serviceHistory = JSON.parse(customer.service_history);
            delete customer.service_history;
        }
        res.json(customer);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        await connection.query('DELETE FROM customers WHERE id = ?', [id]);
        connection.release();
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/providers', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM providers');
        connection.release();

        const providers = rows.map((provider) => {
            provider.serviceType = provider.service_type;
            delete provider.service_type;
            return provider;
        });

        res.json(providers);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/providers', async (req, res) => {
    try {
        const { id, name, serviceType, email, phone, address, status } = req.body;
        const connection = await pool.getConnection();

        // Check if provider with this email already exists
        const [existingEmail] = await connection.query('SELECT id FROM providers WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            connection.release();
            return res.status(400).json({ error: 'A provider with this email already exists' });
        }

        // Check if provider with this name already exists
        const [existingName] = await connection.query('SELECT id FROM providers WHERE name = ?', [name]);
        if (existingName.length > 0) {
            connection.release();
            return res.status(400).json({ error: 'A provider with this name already exists' });
        }

        const providerId = id || `p${Date.now()}`;
        await connection.query('INSERT INTO providers (id, name, service_type, email, phone, address, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [providerId, name, serviceType, email, phone, address, status || 'Active']);

        const [rows] = await connection.query('SELECT * FROM providers WHERE id = ?', [providerId]);
        connection.release();

        const provider = rows[0];
        if (provider) {
            provider.serviceType = provider.service_type;
            delete provider.service_type;
        }

        res.json(provider);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.put('/api/providers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, serviceType, email, phone, address, status } = req.body;
        const connection = await pool.getConnection();
        await connection.query('UPDATE providers SET name = ?, service_type = ?, email = ?, phone = ?, address = ?, status = ? WHERE id = ?', [name, serviceType, email, phone, address, status, id]);
        const [rows] = await connection.query('SELECT * FROM providers WHERE id = ?', [id]);
        connection.release();
        res.json(rows[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/providers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        await connection.query('DELETE FROM providers WHERE id = ?', [id]);
        connection.release();
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/work-orders', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM work_orders');
        connection.release();
        const workOrders = rows.map((wo) => ({
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
            price: wo.price
        }));
        res.json(workOrders);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/work-orders', async (req, res) => {
    try {
        const { id, customerId, technicianIds, title, description, serviceType, status, priority, scheduledStart, scheduledEnd, location, price } = req.body;
        const connection = await pool.getConnection();
        await connection.query('INSERT INTO work_orders (id, customer_id, technician_ids, title, description, service_type, status, priority, scheduled_start, scheduled_end, location, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id || `wo${Date.now()}`, customerId, JSON.stringify(technicianIds), title, description, serviceType, status || 'New', priority || 'Medium', scheduledStart, scheduledEnd, JSON.stringify(location), price]);
        connection.release();
        res.json({ id: id || `wo${Date.now()}` });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.put('/api/work-orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { customerId, technicianIds, title, description, serviceType, status, priority, scheduledStart, scheduledEnd, actualStart, actualEnd, location, price } = req.body;
        const connection = await pool.getConnection();
        const updates = [];
        const values = [];
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
        await connection.query(`UPDATE work_orders SET ${updates.join(', ')} WHERE id = ?`, values);
        const [rows] = await connection.query('SELECT * FROM work_orders WHERE id = ?', [id]);
        connection.release();
        const wo = rows[0];
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
        res.json(wo);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/work-orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        await connection.query('DELETE FROM work_orders WHERE id = ?', [id]);
        connection.release();
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Work Order Resources Endpoints
app.get('/api/work-orders/:workOrderId/resources', async (req, res) => {
    try {
        const { workOrderId } = req.params;
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM work_order_resources WHERE work_order_id = ? ORDER BY uploaded_at DESC', [workOrderId]);
        connection.release();
        const resources = rows.map((resource) => ({
            id: resource.id,
            workOrderId: resource.work_order_id,
            fileName: resource.file_name,
            fileType: resource.file_type,
            filePath: resource.file_path,
            url: `${req.protocol}://${req.get('host')}/${resource.file_path}`,
            fileSize: resource.file_size,
            description: resource.description,
            uploadedBy: resource.uploaded_by,
            uploadedAt: resource.uploaded_at
        }));
        res.json(resources);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/work-orders/:workOrderId/resources', resourceUpload.single('file'), async (req, res) => {
    try {
        const { workOrderId } = req.params;
        const { description } = req.body;
        const file = req.file;
        
        console.log('Upload request:', { workOrderId, description, file: file ? { originalname: file.originalname, mimetype: file.mimetype, size: file.size } : 'No file' });
        
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Get current user from request (simplified - in production you'd verify JWT)
        const uploadedBy = 'Current User'; // You might want to get this from auth token

        // Check if work order exists
        const connection = await pool.getConnection();
        const [workOrderRows] = await connection.query('SELECT id FROM work_orders WHERE id = ?', [workOrderId]);
        
        if (workOrderRows.length === 0) {
            connection.release();
            return res.status(400).json({ error: `Work order with ID ${workOrderId} not found` });
        }

        const resourceId = `res${Date.now()}`;
        const filePath = `uploads/resources/${file.filename}`;
        
        await connection.query(
            'INSERT INTO work_order_resources (id, work_order_id, file_name, file_type, file_path, file_size, description, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [resourceId, workOrderId, file.originalname, file.mimetype, filePath, file.size, description || null, uploadedBy]
        );
        connection.release();

        const resource = {
            id: resourceId,
            workOrderId: workOrderId,
            fileName: file.originalname,
            fileType: file.mimetype,
            filePath: filePath,
            url: `${req.protocol}://${req.get('host')}/${filePath}`,
            fileSize: file.size,
            description: description || null,
            uploadedBy: uploadedBy,
            uploadedAt: new Date().toISOString()
        };

        res.json(resource);
    }
    catch (error) {
        console.error('Upload error:', error);
        
        // Check for specific database constraint violations
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: 'Work order not found. Please check that the work order exists.' });
        }
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Resource with this ID already exists.' });
        }
        
        // Multer file size limit error
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Maximum size is 10MB.' });
        }
        
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

app.delete('/api/work-orders/:workOrderId/resources/:resourceId', async (req, res) => {
    try {
        const { workOrderId, resourceId } = req.params;
        const connection = await pool.getConnection();
        
        // Get the resource first to delete the file
        const [rows] = await connection.query('SELECT file_path FROM work_order_resources WHERE id = ? AND work_order_id = ?', [resourceId, workOrderId]);
        
        if (rows.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Resource not found' });
        }
        
        const resource = rows[0];
        
        // Delete from database
        await connection.query('DELETE FROM work_order_resources WHERE id = ? AND work_order_id = ?', [resourceId, workOrderId]);
        connection.release();
        
        // Delete file from filesystem
        try {
            const fullPath = path_1.default.join(__dirname, 'public', resource.file_path);
            await fs_1.default.unlink(fullPath);
        } catch (fileError) {
            console.warn('Could not delete file:', fileError);
        }
        
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/invoices', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM invoices');
        connection.release();
        const invoices = rows.map((inv) => ({
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
            notes: inv.notes
        }));
        res.json(invoices);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/invoices', async (req, res) => {
    try {
        const { id, workOrderId, customerId, amount, lineItems, subtotal, taxAmount, total, status, issueDate, dueDate, notes } = req.body;
        const connection = await pool.getConnection();
        await connection.query('INSERT INTO invoices (id, work_order_id, customer_id, amount, line_items, subtotal, tax_amount, total, status, issue_date, due_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
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
            notes || null
        ]);
        connection.release();
        res.json({ id: id || `inv${Date.now()}` });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.put('/api/invoices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, lineItems, subtotal, taxAmount, total, status, dueDate, notes } = req.body;
        const connection = await pool.getConnection();
        const updates = [];
        const values = [];
        if (amount !== undefined) {
            updates.push('amount = ?');
            values.push(amount);
        }
        if (lineItems !== undefined) {
            updates.push('line_items = ?');
            values.push(JSON.stringify(lineItems));
        }
        if (subtotal !== undefined) {
            updates.push('subtotal = ?');
            values.push(subtotal);
        }
        if (taxAmount !== undefined) {
            updates.push('tax_amount = ?');
            values.push(taxAmount);
        }
        if (total !== undefined) {
            updates.push('total = ?');
            values.push(total);
        }
        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }
        if (dueDate !== undefined) {
            updates.push('due_date = ?');
            values.push(dueDate);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes);
        }
        if (updates.length > 0) {
            values.push(id);
            await connection.query(`UPDATE invoices SET ${updates.join(', ')} WHERE id = ?`, values);
        }
        const [rows] = await connection.query('SELECT * FROM invoices WHERE id = ?', [id]);
        connection.release();
        const invoice = rows[0];
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
                notes: invoice.notes
            };
            res.json(result);
        }
        else {
            res.status(404).json({ error: 'Invoice not found' });
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/invoices/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        await connection.query('DELETE FROM invoices WHERE id = ?', [id]);
        connection.release();
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/invoice-settings', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM invoice_settings LIMIT 1');
        connection.release();
        const settings = rows[0];
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
        }
        else {
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.put('/api/invoice-settings', async (req, res) => {
    try {
        const { companyName, companyTax, companyAddress, companyPhone, companyEmail, companyWebsite, logoUrl, invoicePrefix, defaultTaxRate, paymentTermsDays, language, footerText } = req.body;
        const connection = await pool.getConnection();
        const [existingRows] = await connection.query('SELECT id FROM invoice_settings LIMIT 1');
        const settingsId = existingRows.length > 0 ? existingRows[0].id : `settings${Date.now()}`;
        if (existingRows.length > 0) {
            await connection.query('UPDATE invoice_settings SET company_name = ?, company_tax = ?, company_address = ?, company_phone = ?, company_email = ?, company_website = ?, logo_url = ?, invoice_prefix = ?, default_tax_rate = ?, payment_terms_days = ?, language = ?, footer_text = ? WHERE id = ?', [companyName, companyTax, companyAddress, companyPhone, companyEmail, companyWebsite, logoUrl, invoicePrefix, defaultTaxRate, paymentTermsDays, language, footerText, settingsId]);
        }
        else {
            await connection.query('INSERT INTO invoice_settings (id, company_name, company_tax, company_address, company_phone, company_email, company_website, logo_url, invoice_prefix, default_tax_rate, payment_terms_days, language, footer_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [settingsId, companyName, companyTax, companyAddress, companyPhone, companyEmail, companyWebsite, logoUrl, invoicePrefix, defaultTaxRate, paymentTermsDays, language, footerText]);
        }
        const [rows] = await connection.query('SELECT * FROM invoice_settings WHERE id = ?', [settingsId]);
        connection.release();
        const settings = rows[0];
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
        }
        else {
            res.status(500).json({ error: 'Failed to save settings' });
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/technicians/:id/location', async (req, res) => {
    try {
        const { id } = req.params;
        const { latitude, longitude, accuracy } = req.body;
        const connection = await pool.getConnection();
        const locationId = `loc${Date.now()}`;
        await connection.query('INSERT INTO technician_locations (id, technician_id, latitude, longitude, accuracy) VALUES (?, ?, ?, ?, ?)', [locationId, id, latitude, longitude, accuracy || null]);
        await connection.query('UPDATE users SET address = ? WHERE id = ? AND role = ?', [JSON.stringify({ lat: latitude, lng: longitude, address: '' }), id, 'Technician']);
        connection.release();
        res.json({ id: locationId, success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/technicians/locations/live', async (req, res) => {
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
        const technicians = rows
            .filter((row) => row.rn === 1 || row.rn === null)
            .map((tech) => ({
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.listen(PORT, async () => {
    await initializeDatabase();
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
