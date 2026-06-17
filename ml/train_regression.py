#!/usr/bin/env python3
"""
Entraîne un XGBoost Regressor pour prédire un prix exact (en €)
à partir de la distance et des zones géographiques K-Means.
Réutilise les artefacts K-Means du train.py principal.
"""
import os
import json
import numpy as np
import pandas as pd
from math import radians, sin, cos, sqrt, atan2

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
from xgboost import XGBRegressor
import joblib

ROOT      = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR  = os.path.join(ROOT, "Data", "DataLake", "processed")
MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
os.makedirs(MODELS_DIR, exist_ok=True)


def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    φ1, φ2 = radians(lat1), radians(lat2)
    dφ, dλ = radians(lat2 - lat1), radians(lon2 - lon1)
    a = sin(dφ / 2) ** 2 + cos(φ1) * cos(φ2) * sin(dλ / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


def parse_geo(geo_str):
    if not isinstance(geo_str, str) or "," not in geo_str:
        return None, None
    try:
        lat, lon = [float(x.strip()) for x in geo_str.split(",", 1)]
        return lat, lon
    except Exception:
        return None, None


print("\n[1/4] Chargement des données...")
df_gares = pd.read_excel(os.path.join(DATA_DIR, "gares.xlsx"))
df_tarif = pd.read_excel(os.path.join(DATA_DIR, "tarifs-tgv.xlsx"))
df_tarif.dropna(subset=["Gare origine - code UIC", "Gare destination - code UIC",
                         "Prix minimum", "Prix maximum"], inplace=True)
print(f"  → {len(df_gares)} gares  |  {len(df_tarif)} tarifs")

print("\n[2/4] Chargement du K-Means existant et construction du dataset...")
kmeans     = joblib.load(os.path.join(MODELS_DIR, "kmeans_gares.pkl"))
scaler_geo = joblib.load(os.path.join(MODELS_DIR, "scaler_geo.pkl"))

geo_parsed = df_gares["Geo Point"].apply(
    lambda x: pd.Series(parse_geo(x), index=["lat", "lon"])
)
df_gares = pd.concat([df_gares, geo_parsed], axis=1)
df_gares_coords = df_gares.dropna(subset=["lat", "lon", "CODE_UIC"]).copy()

coords_scaled = scaler_geo.transform(df_gares_coords[["lat", "lon"]].values)
df_gares_coords = df_gares_coords.copy()
df_gares_coords["cluster"] = kmeans.predict(coords_scaled)
gares_lookup = df_gares_coords.set_index("CODE_UIC")[["lat", "lon", "cluster"]]

df_tarif["prix_moyen"] = (df_tarif["Prix minimum"] + df_tarif["Prix maximum"]) / 2

routes = []
for _, row in df_tarif.iterrows():
    try:
        orig_uic = int(row["Gare origine - code UIC"])
        dest_uic = int(row["Gare destination - code UIC"])
        prix     = float(row["prix_moyen"])
        if np.isnan(prix) or prix <= 0:
            continue
        if orig_uic not in gares_lookup.index or dest_uic not in gares_lookup.index:
            continue
        o = gares_lookup.loc[orig_uic]
        d = gares_lookup.loc[dest_uic]
        dist = haversine(float(o["lat"]), float(o["lon"]), float(d["lat"]), float(d["lon"]))
        if dist < 1.0:
            continue
        routes.append({
            "distance_km":    dist,
            "dist_log":       np.log1p(dist),
            "dist_sq":        dist ** 2,
            "origin_cluster": int(o["cluster"]),
            "dest_cluster":   int(d["cluster"]),
            "prix_moyen":     prix,
        })
    except Exception:
        continue

df_routes = pd.DataFrame(routes)
print(f"  → {len(df_routes)} routes valides")
print(f"  → Prix : min={df_routes['prix_moyen'].min():.1f}€  "
      f"moy={df_routes['prix_moyen'].mean():.1f}€  "
      f"max={df_routes['prix_moyen'].max():.1f}€")

print("\n[3/4] Entraînement XGBoost Regressor...")
FEATURES = ["distance_km", "dist_log", "dist_sq", "origin_cluster", "dest_cluster"]
X = df_routes[FEATURES].values
y = df_routes["prix_moyen"].values

X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)

xgb_reg = XGBRegressor(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    reg_alpha=0.1,
    reg_lambda=1.0,
    random_state=42,
    verbosity=0,
)
xgb_reg.fit(X_tr, y_tr)

y_pred = xgb_reg.predict(X_te)
mae   = mean_absolute_error(y_te, y_pred)
rmse  = mean_squared_error(y_te, y_pred) ** 0.5
r2    = r2_score(y_te, y_pred)
pct20 = float(np.mean(np.abs(y_pred - y_te) <= 20) * 100)  # % dans ±20€

cv_mae = -cross_val_score(xgb_reg, X, y, cv=5, scoring="neg_mean_absolute_error").mean()

print(f"  MAE  : {mae:.2f} €   (erreur moyenne)")
print(f"  RMSE : {rmse:.2f} €")
print(f"  R²   : {r2:.4f}")
print(f"  % dans ±20€ : {pct20:.1f}%")
print(f"  CV MAE (5-fold) : {cv_mae:.2f} €")

print("\n[4/4] Sauvegarde...")
xgb_reg.save_model(os.path.join(MODELS_DIR, "xgb_price_regressor.json"))

rapport = {
    "model": "XGBoost Regressor",
    "objective": "Prédiction prix exact (€) — régression",
    "features": FEATURES,
    "metrics": {
        "mae_eur":        round(mae, 2),
        "rmse_eur":       round(rmse, 2),
        "r2":             round(r2, 4),
        "pct_within_20eur": round(pct20, 1),
        "cv_mae_5fold":   round(cv_mae, 2),
    },
    "hyperparameters": {
        "n_estimators": 300, "max_depth": 5, "learning_rate": 0.05,
        "subsample": 0.8, "colsample_bytree": 0.8,
    },
    "dataset": {
        "n_routes": int(len(df_routes)),
        "n_train":  int(len(X_tr)),
        "n_test":   int(len(X_te)),
        "prix_min": round(float(df_routes["prix_moyen"].min()), 1),
        "prix_moy": round(float(df_routes["prix_moyen"].mean()), 1),
        "prix_max": round(float(df_routes["prix_moyen"].max()), 1),
    },
}
with open(os.path.join(MODELS_DIR, "rapport_regression.json"), "w", encoding="utf-8") as f:
    json.dump(rapport, f, ensure_ascii=False, indent=2)

print(f"  xgb_price_regressor.json sauvegardé")
print(f"  rapport_regression.json sauvegardé")
print(f"\n  Pipeline terminé — MAE = {mae:.1f} € (erreur moyenne attendue)\n")
