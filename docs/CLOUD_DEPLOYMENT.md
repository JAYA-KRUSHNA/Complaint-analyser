# CiviSense AI — Production Cloud Deployment & Optimization Guide

This guide covers complete instructions for deploying CiviSense AI to production across modern cloud providers, utilizing serverless PostgreSQL, containerized microservices, and static CDN hosting.

---

## 🏗️ Architecture Stack

| Component | Technology | Recommended Cloud Provider | Free Tier Available? |
| :--- | :--- | :--- | :---: |
| **Database** | PostgreSQL 15+ (Serverless) | [Neon.tech](https://neon.tech) | ✅ Free (0.5 GB, Pooled) |
| **Backend API** | FastAPI + Python 3.12 (Async) | [Render](https://render.com) / [Railway](https://railway.app) | ✅ Free |
| **Frontend UI** | React 19 + Vite + Tailwind | [Vercel](https://vercel.com) / [Render](https://render.com) | ✅ Free |
| **Containerized** | Docker + Docker Compose + Nginx | AWS EC2 / DigitalOcean / Linode | VPS ($4-6/mo) |

---

## 🚀 Option 1: 100% Free Cloud Deployment (Neon + Render + Vercel)

### Step 1: Provision Neon Serverless PostgreSQL
1. Create an account at [neon.tech](https://neon.tech).
2. Create a new project (e.g. `civisense-production`) in your nearest region.
3. In the Neon Console under **Connection Details**:
   - Select **Pooled connection** (toggles connection pooling via PgBouncer).
   - Copy the provided connection string:
     ```text
     postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
4. Test the connection locally using the built-in diagnostic tool:
   ```bash
   DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" python backend/scripts/test_db_connection.py
   ```

### Step 2: Apply Migrations & Seed Initial Data
Run migrations and database seeding against your Neon cloud database:
```bash
# Apply all 12 database tables
DATABASE_URL="postgresql+asyncpg://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.ap-southeast-1.aws.neon.tech/neondb" \
DATABASE_URL_SYNC="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.ap-southeast-1.aws.neon.tech/neondb" \
alembic upgrade head

# Seed departments, admin accounts, and sample civic grievances
python backend/seed/seed_map_incidents.py
```

### Step 3: Deploy Backend on Render
1. Go to [dashboard.render.com](https://dashboard.render.com) and click **New > Web Service**.
2. Connect your GitHub repository: `https://github.com/JAYA-KRUSHNA/Complaint-analyser.git`.
3. Configure the service settings:
   - **Name**: `civisense-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2 --proxy-headers`
4. Add the following **Environment Variables**:
   - `ENVIRONMENT`: `production`
   - `DEBUG`: `false`
   - `DATABASE_URL`: *(Your pooled Neon connection string from Step 1)*
   - `DATABASE_URL_SYNC`: *(Your pooled Neon connection string from Step 1)*
   - `SECRET_KEY`: *(Generate a 32+ character random secret)*
   - `CORS_ORIGINS`: `https://civisense.vercel.app,http://localhost:5173`
   - `STORAGE_BACKEND`: `local`
5. Click **Create Web Service**. Once deployed, your backend will be live at `https://civisense-backend.onrender.com`.
6. Verify health:
   ```bash
   curl https://civisense-backend.onrender.com/api/health
   ```

### Step 4: Deploy Frontend on Vercel
1. Go to [vercel.com](https://vercel.com) and click **Add New > Project**.
2. Import your GitHub repository.
3. Set **Root Directory** to `frontend`.
4. Framework Preset will auto-detect as **Vite**.
5. Add Environment Variable:
   - `VITE_API_URL`: `https://civisense-backend.onrender.com`
6. Click **Deploy**. Vercel will build the optimized bundles and deploy to edge CDNs worldwide.

---

## 🐳 Option 2: Self-Hosted Docker Compose (VPS / AWS EC2)

Deploy the entire production stack (Nginx, FastAPI, and PostgreSQL) with a single command on any Linux VPS.

### 1. Prerequisites
Ensure Docker and Docker Compose (v2.0+) are installed on your server:
```bash
docker --version
docker compose version
```

### 2. Configure Environment
Clone the repository and copy the production environment template:
```bash
git clone https://github.com/JAYA-KRUSHNA/Complaint-analyser.git
cd Complaint-analyser

# Create production .env
cat <<EOF > .env
POSTGRES_USER=civisense
POSTGRES_PASSWORD=$(openssl rand -hex 16)
POSTGRES_DB=civisense_db
SECRET_KEY=$(openssl rand -hex 32)
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=http://your-server-ip,http://your-domain.com
EOF
```

### 3. Launch the Stack
```bash
# Build and start in detached mode
docker compose -f docker-compose.prod.yml up -d --build

# Inspect running containers
docker compose -f docker-compose.prod.yml ps
```

### 4. Run Migrations & Seed Data Inside Container
```bash
# Run database schema migrations
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Seed initial admin user and sample data
docker compose -f docker-compose.prod.yml exec backend python seed/seed_map_incidents.py
```

### 5. Verify the Deployment
- Web Application: `http://<your-server-ip>/`
- Interactive API Docs: `http://<your-server-ip>/docs`
- Health Diagnostic: `http://<your-server-ip>/api/health`

---

## ⚡ Performance Optimizations Applied

### 1. Frontend Bundle Optimization (`vite.config.ts`)
- **Rollup Vendor Chunking**:
  - `vendor-react`: Isolated core React runtime (`~78 kB gzipped`).
  - `vendor-charts`: Recharts charting engine (`~114 kB gzipped`).
  - `vendor-maps`: Leaflet geospatial library (`~43 kB gzipped`).
  - `vendor-icons`: Lucide icon pack (`~5 kB gzipped`).
  - `index.js`: Application logic (`~41 kB gzipped`).
- Zero chunk size warnings; total initial load reduced by **>60%**.

### 2. HTTP Caching & Compression (`nginx.conf`)
- **Gzip Engine**: Multi-type text and JSON compression with `gzip_comp_level 6`.
- **Immutable Asset Caching**: `Cache-Control: public, max-age=31536000, immutable` for all fingerprinted CSS, JS, and font assets.
- **Microservice Reverse Proxy**: Seamless zero-latency proxying from `/api/` to backend with WebSocket upgrade support.

### 3. Backend Latency & Database Resilience (`database.py` & `main.py`)
- **Automatic Gzip Middleware**: Compressed JSON responses for any payload exceeding 1KB.
- **Neon Auto-Suspend Tolerance**:
  - `pool_pre_ping=True`: Proactively verifies database sockets, re-authenticating seamlessly when serverless Neon instances wake up.
  - `pool_recycle=300`: Refreshes connections every 5 minutes to prevent stale idle socket terminations.
  - `pool_size=5, max_overflow=10`: Stays well within cloud free-tier connection limits while scaling under concurrent loads.
- **Non-Root Container Security**: Both frontend (Nginx alpine) and backend (non-root `civisense` user) follow zero-trust container security standards.
