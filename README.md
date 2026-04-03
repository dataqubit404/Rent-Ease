# 🏠 RentEase - Property Rental Management System

**RentEase** is a modern, full-stack property rental platform designed to provide a seamless experience for both property owners and tenants. It features a high-performance **Next.js 14** frontend, a robust **Node.js/Express** backend, and a secure **MySQL** database managed with Sequelize.

---

Live Demo : https://rent-ease-bice-iota.vercel.app

---
## 🚀 Key Features

-   **✨ Premium UI/UX**: Built with Framer Motion for smooth animations and Lucide React icons. Optimized for Next.js 14.
-   **🔍 Property Discovery**: Advanced filtering by city, type, price, and ratings.
-   **📅 Booking Management**: Real-time availability checks and booking request flows.
-   **💳 Payment Integration**: Fully integrated with **Razorpay** for secure transactions.
-   **🔑 Advanced Auth**: JWT-based authentication with **Forgot Password** and **Reset Password** functionality via email.
-   **🛠 Maintenance Requests**: Direct communication for tenants to report issues to property owners.
-   **📊 Admin Dashboard**: Full platform oversight, property approvals, and analytics.

---

## 🛠 Tech Stack

-   **Frontend**: Next.js 14 (App Router), TailwindCSS, Framer Motion, Axios, Zustand
-   **Backend**: Node.js, Express, Sequelize (ORM), MySQL
-   **Security**: JWT, BcryptJS, Helmet, express-rate-limit
-   **Services**: Razorpay (Payments), Nodemailer (Emails), Multer (File Uploads)

---

## 💻 Local Setup

### 1. Unified Installation
The project features a root `package.json` to manage both services easily.
```bash
# Install dependencies for both frontend and backend
npm run install-all
```

### 2. Database Initialization
1.  Ensure you have a local **MySQL** server running.
2.  Create a database named `rental_management`.
3.  Seed the initial admin user:
```bash
# Run the admin seeder script (backend)
cd rental-backend
npm run seed:admin
```

### 3. Running Environment
```bash
# From the root directory:
npm run dev
```
-   **Frontend**: `http://localhost:3001`
-   **Backend**: `http://localhost:5002`

---

## 📂 Project Structure

### Backend (`/rental-backend`)
-   **`config/`**: Database and environment configurations.
-   **`controllers/`**: Core business logic for each API resource.
-   **`middleware/`**: Authentication (JWT) and request validation.
-   **`models/`**: Sequelize data models for MySQL.
-   **`routes/`**: Express API endpoint definitions.
-   **`services/`**: External integrations (Razorpay, Nodemailer).
-   **`utils/`**: Shared helper functions and loggers.

### Frontend (`/rental-frontend`)
-   **`app/`**: Next.js App Router pages and components.
-   **`components/`**: Reusable UI elements (Navbar, Modals, Cards).
-   **`hooks/`**: Global state management (Zustand) and custom React hooks.
-   **`services/`**: Axios API client and backend service wrappers.
-   **`styles/`**: Global CSS and theme configurations.

---

## 🔄 Core Application Workflow

1.  **Authentication**: Users register/login. JWT is stored in local storage and managed via global state.
2.  **Property Discovery**: Tenants browse properties. Filters (city, price, etc.) use server-side queries.
3.  **Booking Request**: Tenant selects dates and submits a request. The backend calculates total rent and installments.
4.  **Property Approval**: (Admin feature) Listings must be approved before becoming visible to all users.
5.  **Payment Lifecycle**:
    *   Tenant initiates payment.
    *   Frontend triggers **Razorpay SDK**.
    *   Backend verifies the signature and updates payment status.
6.  **Maintenance**: Tenants can submit feedback/requests directly from their dashboard.

---

## 🌐 Deployment (Cloud Ready)

This project is optimized for "Dashboard-First" deployment without needing local `.env` files in production.

### 1. Database (Aiven)
-   Create a **MySQL** instance on the [Aiven.io](https://aiven.io/) **Free Tier**.
-   Ensure **SSL** is enabled (the app is pre-configured for Aiven's SSL requirements).

### 2. Backend (Render)
-   Connect repo and set Root Directory to `rental-backend`.
-   Add **Environment Variables**:
    *   `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (from Aiven).
    *   `DB_SSL_REJECT_UNAUTHORIZED`: `false`
    *   `JWT_SECRET`: *(A random 32+ character string)*
    *   `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`

### 3. Frontend (Vercel)
-   Connect repo and set Root Directory to `rental-frontend`.
-   Add **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: Your Render backend URL + `/api`.
    *   `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Your Razorpay key.

---

## 📄 License & Contact

This project is for educational and portfolio demonstration purposes.

**Author**: [Your Name/GitHub Profile]  
**Repository**: [Project URL]
