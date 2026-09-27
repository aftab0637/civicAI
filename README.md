# CivicAI - Smart City Incident Management & Analytics Platform

CivicAI is a smart public governance and citizen reporting platform that leverages **Deep Learning Image Classification** (via PyTorch) and **Natural Language Processing (NLP)** to automate, prioritize, and dispatch municipal issue reports.

Built with a modern, high-contrast light theme (slate & indigo palette), the project features dual interfaces for citizens and city administrators.

---

## 🚀 Key Project Features (Proof of Work)

1. **Automatic Image Classification (PyTorch MobileNetV3)**:
   - When a citizen uploads a photo of an issue, a pre-trained **MobileNetV3-Small** neural network (sourced from PyTorch's official torchvision model registry) processes the image locally on the CPU.
   - It performs feature extraction and maps generic ImageNet class predictions (e.g. `ashcan`, `street lamp`, `volcano` for cracked pavements) to target municipal categories in real-time.

2. **NLP-Based Severity Grading**:
   - Analyzes user-entered descriptions using localized natural language keyword parsing.
   - Automatically outputs severity ratings (**Low**, **Medium**, **High**, **Critical**) based on urgent danger triggers (e.g. "flooding", "fire", "split road", "blockage").

3. **Government Dispatch Dashboard**:
   - An interactive administrative panel with statistical widgets tracking total filed, pending, in-progress, resolved, and critical tickets.
   - Allows administrators to override severity priority, assign work to specific departments, log remark notes, and update the ticket status.

4. **Transparent Citizen Tracking**:
   - Citizens can track their filed complaints, view department assignments, and read real-time status updates/resolution remarks left by the administrator.

---

## 🔐 Presentation Demo Credentials

To present the project easily, the database initialization script pre-seeds two demo accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Citizen (Reporter)** | `citizen@example.com` | `password123` |
| **Administrator (Manager)** | `admin@civicai.gov` | `adminpassword` |

---

## 🛠️ Step-by-Step Installation & Running Guide

### 🐳 Running via Docker (Easiest Method)

If you have **Docker** and **Docker Compose** installed, you can run the entire platform (PostgreSQL, FastAPI Backend, React Frontend) with a single command:

1. Open your terminal in the project root directory.
2. Build and start the containers in the background:
   ```bash
   docker compose up --build
   ```
3. Docker will:
   - Create a localized PostgreSQL instance (stored persistently).
   - Install all Python backend dependencies (including CPU-optimized PyTorch/Torchvision).
   - Poll and wait for the database container to accept connections.
   - Run the database setup script to create tables and seed the demo credentials.
   - Serve the React frontend locally.
4. **Access the application**:
   - **Frontend Client**: `http://localhost:5173/`
   - **Backend REST API**: `http://localhost:8000/` (Swagger docs at `/docs`)

*To stop all running containers, run `docker compose down`.*

---

### 💻 Local Manual Installation & Setup (Alternative)

### Local Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **PostgreSQL** database server

---

### 1. Database Setup
1. Verify that your PostgreSQL database server is running.
2. Create a new database named `civicai`:
   ```sql
   CREATE DATABASE civicai;
   ```

---

### 2. Backend Setup (FastAPI)
1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a Python virtual environment:
   ```bash
   python -m venv .venv
   ```
3. Activate the virtual environment:
   * **Windows (PowerShell)**: `.\.venv\Scripts\Activate.ps1`
   * **Windows (CMD)**: `.\.venv\Scripts\activate.bat`
   * **macOS / Linux**: `source .venv/bin/activate`
4. Install all dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Set up the environment file:
   - Copy `.env.example` to a new file named `.env`.
   - Open `.env` and verify or update your PostgreSQL connection credentials:
     ```env
     DATABASE_URL=postgresql://<username>:<password>@localhost:5432/civicai
     ```
6. Reinitialize the database schemas and seed the demo credentials:
   ```bash
   python -m app.database.setup_db
   ```
7. Start the backend API server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The backend will be running at `http://localhost:8000`.*

---

### 3. Frontend Setup (React + Vite)
1. Open a new terminal window and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
   *The frontend application will be running at `http://localhost:5173`.*

---

## 📝 Presentation Guide
1. **Homepage**: Open `http://localhost:5173/` to showcase the clean, minimal light-themed launchpad.
2. **Citizen Portal**: Click **Citizen Portal** and log in manually as `citizen@example.com` (pass: `password123`). Submit a complaint with a photo (like a broken road) and show the instant category analysis.
3. **Admin Dispatch**: Log out, click **Admin Dashboard Login**, and log in as `admin@civicai.gov` (pass: `adminpassword`). Assign the ticket to a department (e.g. `Water Board`) and log remarks.
4. **Resolution Tracking**: Log back in as the citizen to show that the resolution status and department update in real-time.
