# 🚀 CollabAI – Real-Time Collaborative Project Manager

CollabAI is a modern **full-stack project management platform** that combines **real-time collaboration** (like Trello/Slack) with **Generative AI assistance**.  
Users can manage projects, chat with team members instantly, and get **AI-powered advice** on tasks and planning.

---

## ✨ Key Features

- ⚡ **Real-Time Collaboration**  
  Tasks and chat messages sync instantly across all users using WebSockets (Socket.io).

- 🤖 **AI Advisor (CollabBot)**  
  Powered by **Google Gemini**, the AI analyzes real project data to provide context-aware suggestions and planning advice.

- 🔐 **Advanced Authentication**

  - Email & Password (JWT)
  - OAuth2 Social Login (Google & GitHub)

- 📋 **Task Management**  
  Create, toggle, and delete tasks with real-time updates.

- 📂 **Project Lifecycle Management**  
  Manage projects across multiple states:

  - Active
  - Completed
  - Archived
  - Abandoned  
    (with permission-based restrictions)

- 🔔 **Real-Time Notifications**  
  Instant bell notifications for new chat messages.

- 🔍 **Search & Filter**  
  Server-side pagination, sorting, and live search for projects and users.

- 📱 **Responsive UI**  
  Built with Angular and Tailwind CSS for a modern, responsive experience.

---

## 🛠️ Tech Stack

### Frontend

- Angular 17+
- Tailwind CSS
- RxJS & Angular Signals

### Backend

- Node.js
- Express.js
- Socket.io

### Database

- PostgreSQL
- Sequelize ORM

### AI

- Google Gemini API

### DevOps

- Docker
- Docker Compose

---

## ⚙️ Prerequisites

Before running the project, make sure you have:

- **Docker Desktop** (Recommended)
- **Git**

---

## 🚀 Quick Start (Docker – Recommended)

This is the **easiest and fastest** way to run the project.  
Docker automatically sets up the **Database**, **Backend**, and **Frontend**.

---

### 1️⃣ Clone the Repository

```bash
git clone <YOUR_REPO_URL>
cd <YOUR_PROJECT_FOLDER>
```

---

### 2️⃣ Setup Environment Variables (Important!)

Navigate to the backend folder:

```bash
cd backend
```

Create a `bash .env` file:

```bash
# backend/.env

# Database Configuration (Docker defaults)
DB_HOST=postgres
DB_USER=postgres
DB_PASS=postgres
DB_NAME=collab_db
PORT=3000

# Security
JWT_SECRET=super_secret_key_123

# 🤖 Google Gemini API Key (Required)
# Get one at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# 🔑 OAuth2 Configuration

# Google OAuth
# Redirect URI: http://localhost:3000/api/auth/google/callback
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth
# Redirect URI: http://localhost:3000/api/auth/github/callback
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 3️⃣ Run with Docker Compose

From the root directory (where `bash docker-compose.yml` is located):

```bash
docker compose up -d --build
```

### 🌐 Access the App

- Frontend: http://localhost
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432

### 🧪 How to Test Key Features

## 1️⃣ Real-Time Sync

1. Open the app in **two broser tabs** or (Incognito)
2. Log in as **User A** in tab 1 and **User B** in tab 2.
3. Both users open the same project.
4. User A sends a message or create a task.

## ✅ Result:

User B sees updates instantly without refreshing

## 2️⃣ AI Advisor 🤖

1. Open any project.

2. Click the Floating Action Button (✨) in the bottom-right corner.

3. Ask:

`nginx What project should I focus on?`

## ✅ Result:

The AI analyzes real project deadlines and progress from the database and returns personalized advice.

## 3️⃣ Project Lifecycle Management

1. Open a Project Detail page.

2. Click Edit Details.

3. Change project status to Abandoned.

## ✅ Result:

- Inputs become disabled (read-only)

- A warning banner appears

## 4️⃣ Notifications 🔔

1. User A sends a chat message.

2. Check User B’s header.

## ✅ Result:

- Bell icon shows a red dot

- Clicking it navigates directly to the chat message.

### 🐛 Troubleshooting

### ❌ Database Connection Error

- Make sure Docker is running

- Ensure backend/.env exists

- Verify DB credentials (postgres/postgres)

### ❌ AI Not Responding

- Check GEMINI_API_KEY in .env

- If you receive a 429 error, wait (rate limiting)

### ❌ Social Login Failed

Ensure redirect URIs match exactly:

Google

`bash http://localhost:3000/api/auth/google/callback`

GitHub

`bash http://localhost:3000/api/auth/github/callback`

### 👨‍💻 Developer Guide (Manual Run – No Docker)

## Database

- Install PostgreSQL locally

- Create a database named collab_db

- Update .env:

`bash DB_HOST=localhost`

## Backend

```bash
cd backend
npm install
npm run dev
```

## Frontend

```bash
cd frontend
npm install
ng serve
```

Frontend will be available at:

```arduino
http://localhost:4200
```
