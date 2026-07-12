# 💼 AssetFlow - Enterprise Asset & Resource Management System

AssetFlow is a centralized, role-based ERP platform designed to simplify and digitize how organizations track, allocate, and maintain their physical assets and shared resources. By replacing manual spreadsheets and paper logs, AssetFlow provides real-time visibility, structured lifecycles, and automated conflict-blocking workflows.

---

## 🌟 Core Features

- 🔐 **Secure Role-Based Workflows**: Multi-role access controls (Admin, Asset Manager, Department Head, Employee) secured with JWT authorization.
- 🏢 **Dynamic Organization Setup**: Manage departments, parent-child structures, department heads, and employee directories.
- 📐 **Dynamic Custom Field Schemas**: Admins can define custom attribute schemas per category (e.g., RAM/Storage for Laptops; License Plate/Fuel Type for Vehicles) stored dynamically as JSON specifications.
- 📁 **Asset Directory & QR Tag Simulator**: Complete directory listings with category/status/department filtering and a built-in serial/QR tag scan simulator.
- 🔄 **Double-Allocation Block & Transfers**: The system rejects double-allocations at the database level and guides users to raise a peer-to-peer equipment **Transfer Request** instead.
- 📅 **Resource Booking Timeline**: Schedule meeting rooms, vehicles, and tools with conflict-blocked time reservation bars.
- 📋 **Kanban Maintenance Board**: A 5-column Kanban board (**Pending**, **Approved**, **Tech Assigned**, **In Progress**, **Resolved**) for equipment repair tracking.
- 🔎 **Audit Campaigns**: Schedule and run check-off inventory audits categorizing items as *Verified*, *Missing*, or *Damaged* with automatic discrepancy reports.
- 📊 **Custom Analytics**: Responsive SVG analytics charts showing allocations by department and maintenance ticketing histories.
- 📜 **Audit Trail Activity Logs**: A system-wide chronological activity log displaying audit trails of all allocations, bookings, and repair transitions with pagination.

---

## 📂 Project Directory Structure

```
Odoo Hackathon 2026/
├── backend/
│   ├── config/             # DB and mail transporter configurations
│   ├── controllers/        # Express request and workflow handlers
│   ├── database/           # MySQL schema definitions and mock data seeders
│   ├── middleware/         # Auth, session, and role validator guards
│   ├── models/             # Relational data access layers (MySQL)
│   ├── routes/             # API routes definition
│   ├── services/           # Nodemailer transits and OTP operations
│   ├── tests/              # Mocha, Chai & Supertest integration suite
│   ├── package.json        # Backend scripts & NPM dependencies
│   └── server.js           # Server application bootstrap
├── frontend/
│   ├── public/             # Static SVG, image, and page assets
│   ├── src/
│   │   ├── components/     # UI components (Sidebars, Navbars, RouteGuards)
│   │   ├── context/        # Auth JWT Session contexts
│   │   ├── layouts/        # Dashboard shell & Auth container layouts
│   │   ├── pages/          # ERP Views (Dashboard, Assets, Kanban, Scheduler, etc.)
│   │   ├── services/       # Axios API client instances
│   │   ├── App.jsx         # Router layouts and guard registration
│   │   ├── main.jsx        # Client bootstrap entry
│   │   └── index.css       # Tailwind directives & design token classes
│   ├── package.json        # Frontend compiler package config
│   ├── index.html          # Web page root template
│   └── vite.config.js      # Vite build configurations
└── README.md               # Main project documentation
```

---

## 🛠️ Technology Stack

| Layer | Technology / Library | Description |
|---|---|---|
| **Core Client** | React 19 & JavaScript | Component rendering and client state management |
| **Styling** | Tailwind CSS & CSS | Custom Glassmorphic theme layouts |
| **Bundler** | Vite 6 | Development server and production compiler |
| **API Server** | Node.js & Express | REST API routing and controller services |
| **Database** | MySQL (Aiven Cloud) | Relational database storage |
| **Mailing** | Nodemailer (Gmail SMTP) | Real OTP transits and notifications |
| **Testing** | Mocha, Chai & Supertest | Automated integration testing |

---

## 🚀 Setup & Installation

### 1. Database Seeding & Schema Setup
Make sure the database is configured in `backend/.env`. Then run the seeder to drop existing tables, create the database schema, and seed the default testing datasets:
```bash
cd backend
node database/init.js
```

### 2. Start Backend Server
The server runs on port `5000` by default.
```bash
cd backend
npm run dev
```

### 3. Start Frontend Client
Vite dev server runs on port `5173`.
```bash
cd frontend
npm run dev
```

---

## 🔑 Seeder Login Credentials

For manual testing of the UI, use the seeded accounts representing various operational roles:

| Role | Email | Password | Access Level / Features |
|---|---|---|---|
| **System Admin** | `admin@assetflow.com` | `Admin@123` | Full category schemas, organization setup, department heads. |
| **Asset Manager** | `sarah.connor@assetflow.com` | `Password@123` | Asset directory creation, check-ins, return condition logging. |
| **Department Head** | `priya.devi@assetflow.com` | `Password@123` | Resource approvals, transfer validation. |
| **Employees** | `rahul.raghavan@assetflow.com`<br>`john.doe@assetflow.com` | `Password@123` | Booking timelines, repair tickets submission. |

> [!NOTE]
> You can also register a brand new employee account on the registration page. A real 6-digit verification code will be sent to your email inbox to complete the account verification step.

---

## 🧪 Running Integration Tests

The backend includes a complete integration suite verifying registrations, OTP DB retrievals, login sessions, categories, double-allocations, bookings overlap conflicts, and maintenance reports:

To execute the tests:
```bash
cd backend
npm test
```
