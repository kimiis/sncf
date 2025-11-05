# Utiliser une image python officielle
FROM python:3.11-slim

# Définit le dossier de travail dans le conteneur
WORKDIR /app


COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste du code source
COPY . .

EXPOSE 8000

# Commande pour lancer FastAPI avec Uvicorn
CMD cd /app/sncf-analytics-service/app/ ; fastapi run ./main.py
