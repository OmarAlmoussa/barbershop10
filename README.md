# MOON Barbershop

A modern barbershop website with booking system and admin panel.

## Features

### Customer Website
- View services and prices
- View team members
- Book appointments online
- Modern and responsive design

### Admin Panel
- Secure login system
- Manage services
- Manage team members
- View and manage bookings
- Dashboard with statistics

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
- Rename `config.env` to `.env`
- Update the MongoDB connection string
- Set a secure JWT secret

3. Add sample data:
```bash
npm run seed
```

4. Start the server:
```bash
npm run dev
```

5. Access the website:
- Website: http://localhost:5000
- Admin Panel: http://localhost:5000/admin/login.html

## Technologies Used
- Node.js
- Express.js
- MongoDB
- JWT Authentication
