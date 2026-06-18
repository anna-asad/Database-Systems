# MediQueue

**Clinic Appointment & Token Management System**

MediQueue is a clinic management platform that handles appointment booking, queue/token tracking, doctor and admin workflows, and patient history — built to reduce waiting-room chaos and give clinics a structured way to manage daily patient flow.

## Features

### User Accounts & Access
- **Registration** — Patients, doctors, and clinic staff can create accounts with their personal details, secured with password-based authentication.
- **Role-Based Login** — Separate login panels for Patients, Doctors, and Reception/Admin.
- **Profile Management** — Users can update their name and contact details, profile picture, and role-specific information (medical history for patients; specialization and schedule for doctors).

### Appointments & Queueing
- **Online Appointment Booking** — Patients can select a doctor, choose a date and time slot, and confirm their appointment.
- **Token Generation** — Every booking generates a unique token number, shown live on a queue display screen.
- **Estimated Waiting Position** — Patients can see the token currently being served, how many patients are ahead of them, and their own token number.
- **Rescheduling & Cancellation** — Patients can reschedule or cancel appointments, with the token queue updating automatically.
- **Missed Appointment Recovery (Walk-In)** — Missed appointments are marked accordingly, and patients can be added to the same-day waiting list by reception, subject to availability, with the queue updating dynamically.

### Doctor Tools
- **Doctor Dashboard** — View today's appointments, call the next patient, mark appointments as completed, and add remarks for each visit.
- **Leave Management** — Doctors can apply for leave with a reason. Once approved, all affected appointments are automatically cancelled, patients are notified, and the doctor receives a summary of the cancellations.

### Admin Tools
- **Admin Dashboard** — Manage doctors, patients, appointments, and system settings; approve or reject leave requests; and view overall system statistics.
- **Blacklist Automation** — Patients who miss more than 3 appointments are automatically blacklisted and blocked from booking further appointments, with admin able to manually review or lift the blacklist.

### Patient Records & Billing
- **Patient History & Visit Statistics** — Tracks patient name and CNIC, total visits, successful and missed visits, and doctor remarks across appointments, with a full appointment history view.
- **Fee & Billing System** — Manages consultation fees, generates a downloadable and printable fee slip after each successful appointment, and maintains a payment and billing history.

## Tech Stack

* **Frontend:** React + Vite
* **Backend:** Node.js + Express
* **API:** RESTful API
* **Authentication:** JWT-based authentication with localStorage session persistence
* **Authorization:** Role-based access control (Patient, Doctor, Admin)
* **Database:** SQL Server
* **Configuration:** Environment variables for sensitive credentials

## Getting Started

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database Connection

Create a `.env` file in the `backend` folder with the following variables:
```
DB_SERVER=your_server
DB_DATABASE=MediQueue
DB_USER=your_user
DB_PASSWORD=your_password
JWT_SECRET=mediqueue_secret_key
PORT=5000
```

## Authentication

- Role-based registration for Patients, Doctors, and Admins, each with its own form validation (email format, password length, CNIC format, contact number format, and role-specific fields like specialization or consultation fee).
- JWT token-based login with auto-redirect based on user role.
- Protected routes with role-based access control.
- Persistent login via token stored in localStorage.

### Key Routes
```
/login                  → Login page
/register               → Role selection
/register/patient       → Patient registration
/register/doctor        → Doctor registration
/register/admin         → Admin registration
```

### Key API Endpoints
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Log in a user
- `GET /api/auth/me` — Get the current user's profile