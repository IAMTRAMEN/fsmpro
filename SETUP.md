# FSM App Setup & Running Guide

## Prerequisites
- XAMPP (with MySQL running on port 3306)
- Node.js and npm installed
- Ports 5000 (backend) and 5173 (frontend Vite) available

## Database Setup (Already Done)
Database and tables have been created with mock data via `setup-db.ts`

## Starting the Application

### Terminal 1: Start Backend Server
```bash
npm run dev:server
```
Backend will start on `http://localhost:5000/api`

### Terminal 2: Start Frontend Dev Server
```bash
npm run dev
```
Frontend will start on `http://localhost:5173` (or configured Vite port)

### Test Login Credentials
- **Manager**: sarah@fsm.com / password
- **Owner**: mike@fsm.com / password  
- **SuperAdmin**: admin@fsm.com / password
- **Technician**: john@fsm.com / password (also lisa@fsm.com, bob@fsm.com)

## Database Info
- **Host**: localhost
- **User**: root
- **Password**: (empty)
- **Database**: fsm_app

## API Endpoints

### Authentication
- `POST /api/login` - Login with email/password

### Users Management
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Providers
- `GET /api/providers` - Get all providers
- `POST /api/providers` - Create provider
- `PUT /api/providers/:id` - Update provider
- `DELETE /api/providers/:id` - Delete provider

### Work Orders
- `GET /api/work-orders` - Get all work orders
- `POST /api/work-orders` - Create work order
- `PUT /api/work-orders/:id` - Update work order
- `DELETE /api/work-orders/:id` - Delete work order

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create invoice
- `DELETE /api/invoices/:id` - Delete invoice

## Troubleshooting

### Backend won't start
- Check if MySQL is running in XAMPP
- Verify port 5000 is not in use: `netstat -ano | findstr :5000`

### Frontend won't connect to backend
- Ensure backend is running on `http://localhost:5000`
- Check browser console for CORS errors
- Backend has CORS enabled for all origins

### Database issues
- To recreate tables: `npm run setup-db` (if added to package.json)
- Current setup was run with `npx tsx setup-db.ts`

## Build for Production
```bash
npm run build
```
Output will be in `dist/` folder
