# Full Project Setup & Environment Guide 🚀

Welcome to the **Indian Event Platform**! This guide details exactly how the environment is structured and how you can set it up from scratch on any machine.

---

## 🛠️ Tech Stack Overview
*   **Backend**: Python, Django, Django REST Framework, SQLite (Database)
*   **Frontend**: React, TypeScript, Vite, Vanilla CSS (Glassmorphism UI)
*   **Integrations**: mock payment, Django Anymail/SendGrid (Emails)

---

## 1. Prerequisites
Before you begin, ensure you have the following installed on your system:
*   **Python 3.10+** (For the backend)
*   **Node.js 18+** (For the frontend)
*   **Git** (Optional, for version control)

---

## 2. Backend Setup (Django) 🐍

The backend uses an isolated Python "Virtual Environment" to keep all dependencies separate from your main computer.

1. **Navigate to the backend folder**:
   ```powershell
   cd backend
   ```

2. **Create the Virtual Environment**:
   *This creates a folder named `venv` that will hold all the Python libraries.*
   ```powershell
   python -m venv venv
   ```

3. **Activate the Virtual Environment**:
   *You must do this every time you open a new terminal.*
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

4. **Install the Required Libraries**:
   *This reads the `requirements.txt` file and downloads Django, Django REST Framework, Razorpay, etc.*
   ```powershell
   pip install -r requirements.txt
   ```

5. **Apply Database Migrations**:
   *This builds the tables (Users, Events, Bookings) inside the SQLite database.*
   ```powershell
   python manage.py makemigrations
   python manage.py migrate
   ```

---

## 3. Environment Variables (`.env`) 🔐

Security is a priority. Sensitive keys are NOT hardcoded into the code; they are read from a hidden file called `.env`.

1. Inside the `backend/` folder, create a file named exactly **`.env`**.
2. Add the following configurations:

```ini
# --- GENERAL SETTINGS ---
SECRET_KEY=generate-a-strong-random-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000

# --- PAYMENT GATEWAYS (Mock/Test Mode) ---
RAZORPAY_KEY_ID=test_key_id
RAZORPAY_KEY_SECRET=test_key_secret
STRIPE_SECRET_KEY=sk_test_placeholder

# --- EMAIL AUTOMATION (Personal Gmail) ---
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=your_email@gmail.com
```

---

## 4. Frontend Setup (React/Vite) ⚛️

The frontend is a completely separate application that talks to the Django backend via APIs.

1. **Navigate to the frontend folder**:
   ```powershell
   cd frontend
   ```

2. **Install Node Modules**:
   *This reads the `package.json` file and downloads React, TypeScript, Vite, and routing libraries.*
   ```powershell
   npm install
   ```

*(Note: The frontend does not currently require a `.env` file because it dynamically fetches the API from `http://localhost:8000`)*

---

## 5. How to Run the Project 🏁

To see the platform in action, you need to run **both** servers simultaneously.

### Terminal 1 (Backend)
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```
*Runs on `http://localhost:8000`*

### Terminal 2 (Frontend)
```powershell
cd frontend
npm run dev
```
*Runs on `http://localhost:5173`*

---

## 6. Seed the Database (Optional) 🌱
If you have an empty database and want to test the analytics, run the intelligent seed script to generate fake users, events, and bookings:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python seed_v5_variations.py
```

**Happy Building!** 🏙️🏆🔥
