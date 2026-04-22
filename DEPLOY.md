# Guide de déploiement — RailGo

## Architecture

```
Vercel (Frontend React)
    ↓ REACT_APP_API_URL
Railway — Node.js Backend (Express)
    ↓ FASTAPI_URL          ↓ DB_*
Railway — FastAPI (Python)   Railway — PostgreSQL
```

---

## Fichiers de configuration à créer

### `vercel.json` — à la racine du repo
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/build",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

### `.vercelignore` — à la racine du repo
```
/api/
/backend/
/Data/
/requirements.txt
/Dockerfile
```

---

### `railway.json` — à la racine du repo (service FastAPI)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  }
}
```

---

### `Dockerfile` — à la racine du repo (service FastAPI)
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api/ .
COPY Data/ ./Data/

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

---

### `.dockerignore` — à la racine du repo
```
frontend/
backend/
.git/
*.md
.vercelignore
vercel.json
nul
```

---

### `backend/railway.json` — service Node.js
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "node src/server.js"
  }
}
```

---

### `api/app/__init__.py` — fichier vide obligatoire
```python

```

---

## Variables d'environnement

### Vercel (Frontend)
| Variable | Valeur |
|---|---|
| `REACT_APP_API_URL` | `https://<backend>.up.railway.app/api` |

### Railway — service Node.js (Backend)
| Variable | Valeur |
|---|---|
| `PORT` | `8000` |
| `JWT_SECRET` | chaîne secrète aléatoire |
| `FASTAPI_URL` | `https://<fastapi>.up.railway.app` |
| `DB_HOST` | valeur de `PGHOST` (service PostgreSQL) |
| `DB_USER` | valeur de `PGUSER` |
| `DB_PASS` | valeur de `PGPASSWORD` |
| `DB_NAME` | valeur de `PGDATABASE` |
| `DB_PORT` | `5432` |
| `DB_SSL` | `false` |

### Railway — service FastAPI
Aucune variable à configurer.

---

## Configuration Railway (dashboard)

### Service FastAPI
- **Root Directory** : `/`
- **Custom Start Command** : vide

### Service Node.js
- **Root Directory** : `backend`
- **Custom Start Command** : vide

---

## Ordre de déploiement

```
1. PostgreSQL  → créer le service, récupérer PGHOST / PGUSER / PGPASSWORD / PGDATABASE
2. FastAPI     → Root Directory = /  →  déployer
3. Node.js     → remplir toutes les variables  →  déployer
4. Frontend    → remplir REACT_APP_API_URL  →  déployer
```

---

## Erreurs fréquentes

| Erreur | Fix |
|---|---|
| `$PORT is not a valid integer` | Vider le Custom Start Command dans Railway |
| `FileNotFoundError: /Data/...` | Root Directory FastAPI doit être `/` pas `/api` |
| `ModuleNotFoundError: No module named 'app'` | Créer `api/app/__init__.py` vide |
| `ECONNREFUSED ::1:5432` | `DB_HOST` ne doit pas être `localhost` |
| `ENOTFOUND PGHOST` | Copier la valeur de `PGHOST`, pas son nom |
| `502 Bad Gateway` sans CORS | Vérifier les logs du service Node.js |
| `401` après changement `JWT_SECRET` | Se déconnecter et se reconnecter |
| `No module named 'fastapi'` | Vérifier que `railway.json` a `builder: DOCKERFILE` |
| Routes React → 404 sur Vercel | Vérifier les `rewrites` dans `vercel.json` |
| `frontend/src/api/` ignoré | `.vercelignore` doit avoir `/api/` avec le `/` initial |
