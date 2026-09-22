# CiviSense AI — Intelligent Civic Complaint Prioritization System

> AI-powered civic complaint management platform with multi-model classification, severity assessment, and priority scoring.

## 🏗️ Architecture

```
civisense/
├── backend/           # FastAPI + PostgreSQL + SQLAlchemy
│   ├── app/
│   │   ├── api/v1/    # REST API endpoints
│   │   ├── models/    # 12 SQLAlchemy models
│   │   ├── services/  # AI services (rule-based + ML)
│   │   └── core/      # Auth, constants, security
│   └── alembic/       # Database migrations
├── frontend/          # React + TypeScript + Vite + Tailwind
│   └── src/
│       ├── pages/     # Dashboard, Complaints, Analytics, Queue
│       ├── layouts/   # Sidebar layout with glassmorphism
│       └── lib/       # API client, constants
└── docker-compose.yml # PostgreSQL container
```

## ✨ Features

### AI Engine (3-Layer Classification)
- **Text Classification** — Rule-based (12 categories) + ML (TF-IDF + Logistic Regression/SVM/Random Forest)
- **Severity Assessment** — Multi-factor scoring (0-10) with keyword analysis
- **Urgency Detection** — Time-critical, safety risk, and vulnerable population flags
- **Priority Engine** — Civic Impact Score (0-100) using 8 weighted factors
- **Similarity Detection** — TF-IDF cosine similarity for duplicate/related complaints
- **Incident Clustering** — Greedy clustering to group related complaints

### Backend
- FastAPI REST API with 30+ endpoints
- JWT authentication with RBAC (Citizen/Officer/Admin/SuperAdmin)
- PostgreSQL with 12 normalized tables
- Alembic migrations
- Auto-analysis pipeline triggered on complaint submission

### Frontend
- React + TypeScript + Vite
- Dark sidebar navigation (collapsible)
- Glassmorphism design system
- Dashboard with recharts (pie, bar charts)
- Priority Queue for officers/admins
- Analytics page with category intelligence

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL (or Docker)

### 1. Database
```bash
docker-compose up -d  # Starts PostgreSQL on port 5432
```

### 2. Backend
```bash
cd civisense
python -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Copy and configure environment
cp backend/.env.example backend/.env
# Edit .env with your DATABASE_URL

# Run migrations
cd backend && alembic upgrade head

# Seed data
python -c "from app.seeds import seed_all; import asyncio; asyncio.run(seed_all())"

# Start server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

### 4. Train ML Models (Optional)
```bash
cd backend
python -c "from app.services.ml.classifier_pipeline import train_and_save; train_and_save()"
```

## 🔑 Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@civisense.ai | admin123 |
| Officer | officer@civisense.ai | officer123 |

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login (JWT) |
| GET | `/api/v1/complaints` | List complaints |
| POST | `/api/v1/complaints` | Create + auto-analyze |
| GET | `/api/v1/dashboard/stats` | Dashboard statistics |
| GET | `/api/v1/dashboard/priority-queue` | Priority-sorted queue |
| POST | `/api/v1/ml/train` | Train ML models |
| GET | `/api/v1/ml/models` | List available models |
| POST | `/api/v1/ml/compare/{id}` | Compare rule-based vs ML |
| GET | `/api/v1/analytics/similar/{id}` | Find similar complaints |
| POST | `/api/v1/analytics/cluster` | Run incident clustering |
| GET | `/api/v1/analytics/category-trends` | Category analytics |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL (asyncpg) |
| Auth | JWT (python-jose), bcrypt, RBAC |
| ML | scikit-learn, TF-IDF, joblib |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, Glassmorphism |
| Charts | Recharts |

## 📊 ML Model Performance

| Model | Accuracy | F1 Score | Training Time |
|-------|----------|----------|---------------|
| Logistic Regression 🏆 | 100% | 1.000 | 0.17s |
| SVM (Linear) | 100% | 1.000 | 0.11s |
| Random Forest | 100% | 1.000 | 0.45s |

*Trained on 600 synthetic samples across 12 categories*

## 📜 License

MIT
