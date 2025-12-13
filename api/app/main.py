from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import base64
import requests
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2
import os
import time

app = FastAPI()

# Cache simple pour éviter les requêtes Overpass répétées (rate limiting 429)
overpass_cache = {}
CACHE_DURATION = 300  # 5 minutes

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Chemin vers la racine du projet (2 niveaux au-dessus de main.py)
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Chemins vers fichiers Excel (source unique : Data/DataLake/processed/)
DATA_DIR = os.path.join(ROOT_DIR, "Data", "DataLake", "processed")
tarif_file = os.path.join(DATA_DIR, "tarifs-tgv.xlsx")
co2_file = os.path.join(DATA_DIR, "emission-co2-perimetre-usage.xlsx")
gares_file = os.path.join(DATA_DIR, "gares.xlsx")

# Chargement des données Excel
print(f"[STARTUP] Chargement de {tarif_file}...")
df_tarif = pd.read_excel(tarif_file)
df_tarif.dropna(
    subset=[
        "Gare origine",
        "Gare destination",
        "Gare origine - code UIC",
        "Gare destination - code UIC",
    ],
    inplace=True,
)
print(f"[STARTUP] tarifs: {df_tarif.shape}")

print(f"[STARTUP] Chargement de {co2_file}...")
df_co2 = pd.read_excel(co2_file)
df_co2.dropna(subset=["Origine_uic", "Destination_uic"], inplace=True)
print(f"[STARTUP] co2: {df_co2.shape}")

print(f"[STARTUP] Chargement de {gares_file}...")
df_gares = pd.read_excel(gares_file)
print(f"[STARTUP] gares: {df_gares.shape}")

# Auth API SNCF
api_key = "2d5f9bc9-9eb2-471b-bba8-24d542cf79ae"
token = base64.b64encode(f"{api_key}:".encode()).decode()
headers = {"Authorization": f"Basic {token}"}

# URL Overpass (OSM)
OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def overpass_query_cached(query: str, cache_key: str, timeout: int = 30):
    """Exécute une requête Overpass avec cache pour éviter le rate limiting 429."""
    now = time.time()

    # Vérifier le cache
    if cache_key in overpass_cache:
        cached_data, cached_time = overpass_cache[cache_key]
        if now - cached_time < CACHE_DURATION:
            print(f"[CACHE] Utilisation du cache pour {cache_key}")
            return cached_data

    # Requête Overpass
    try:
        resp = requests.post(OVERPASS_URL, data={"data": query}, timeout=timeout)
        resp.raise_for_status()
        data = resp.json()
        # Stocker en cache
        overpass_cache[cache_key] = (data, now)
        return data
    except Exception as e:
        print(f"[ERROR] Erreur Overpass: {e}")
        # Retourner le cache expiré si disponible
        if cache_key in overpass_cache:
            print(f"[CACHE] Utilisation du cache expiré pour {cache_key}")
            return overpass_cache[cache_key][0]
        return {"elements": []}


@app.get("/gares")
def get_gares():
    gares = sorted(df_gares["LIBELLE"].dropna().unique().tolist())
    return {"gares": gares}


@app.get("/autocomplete")
def autocomplete(q: str = ""):
    print(f"[DEBUG] autocomplete appelé avec q={q}")
    print(f"[DEBUG] df_gares shape: {df_gares.shape}")
    q_lower = q.lower()
    print(f"[DEBUG] Recherche en cours...")
    resultats = [
        gare
        for gare in df_gares["LIBELLE"].dropna().unique()
        if q_lower in gare.lower()
    ]
    print(f"[DEBUG] {len(resultats)} résultats trouvés")
    return resultats[:10]


@app.get("/", response_class=HTMLResponse)
def root():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
      <title>Recherche de trajet SNCF</title>
      <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
      <script src="https://code.jquery.com/ui/1.13.2/jquery-ui.min.js"></script>
      <link rel="stylesheet" href="https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css"/>
    </head>
    <body>
      <h2>Recherche de trajet SNCF</h2>
      <label>Gare départ: <input id="from_city" /></label><br/><br/>
      <label>Gare arrivée: <input id="to_city" /></label><br/><br/>
      <button id="searchBtn">Rechercher</button>
      <pre id="result"></pre>
      <script>
        function setupAutocomplete(selector) {
          $(selector).autocomplete({
            source: function(request, response) {
              $.ajax({
                url: "/autocomplete",
                data: { q: request.term },
                success: function(data) {
                  response(data);
                }
              });
            },
            minLength: 2
          });
        }
        $(document).ready(function() {
          setupAutocomplete("#from_city");
          setupAutocomplete("#to_city");
          $("#searchBtn").click(function() {
            const from_city = $("#from_city").val();
            const to_city = $("#to_city").val();
            if (!from_city || !to_city) {
              alert("Veuillez saisir les deux gares");
              return;
            }
            $.getJSON("/trajet", { from_city, to_city }, function(data) {
              $("#result").text(JSON.stringify(data, null, 2));
            }).fail(() => {
              $("#result").text("Erreur lors de la récupération du trajet.");
            });
          });
        });
      </script>
    </body>
    </html>
    """
    return html_content


def get_code_uic(station_name: str):
    serie = df_gares.loc[
        df_gares["LIBELLE"].str.lower() == station_name.lower(), "CODE_UIC"
    ]
    if len(serie) == 0:
        return None
    return int(serie.values[0])


def get_coords(code_uic: int):
    geo = df_gares.loc[df_gares["CODE_UIC"] == code_uic, "Geo Point"].values
    if len(geo) == 0:
        return None, None
    latlon_str = geo[0]
    if isinstance(latlon_str, str) and "," in latlon_str:
        lat, lon = [float(x.strip()) for x in latlon_str.split(",")]
        return lat, lon
    return None, None


def distance_haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    lat1_rad = radians(lat1)
    lon1_rad = radians(lon1)
    lat2_rad = radians(lat2)
    lon2_rad = radians(lon2)
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    a = sin(dlat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


def estime_co2_train(distance_km: float):
    return 0.0194 * distance_km


def estime_co2_voiture(distance_km: float):
    return 0.122 * distance_km


def get_full_journey(from_code: int, to_code: int):
    now = datetime.now().strftime("%Y%m%dT%H%M%S")
    params = {
        "from": f"stop_area:SNCF:{from_code}",
        "to": f"stop_area:SNCF:{to_code}",
        "datetime": now,
    }
    response = requests.get(
        "https://api.sncf.com/v1/coverage/sncf/journeys",
        params=params,
        headers=headers,
    )
    if response.status_code != 200:
        return None
    data = response.json()
    journeys = data.get("journeys", [])
    if not journeys:
        return None
    return journeys[0]


def get_hotels_near(lat_gare: float, lon_gare: float, radius_m: int = 1000):
    """
    Retourne une liste d'hôtels OSM proches:
    [{name, lat, lon, distance_km_from_station}, ...]
    """
    query = f"""
    [out:json];
    (
      node["tourism"="hotel"](around:{radius_m},{lat_gare},{lon_gare});
      way["tourism"="hotel"](around:{radius_m},{lat_gare},{lon_gare});
      relation["tourism"="hotel"](around:{radius_m},{lat_gare},{lon_gare});
    );
    out center;
    """
    cache_key = f"hotels_{lat_gare:.4f}_{lon_gare:.4f}_{radius_m}"
    data = overpass_query_cached(query, cache_key, timeout=25)

    hotels = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = tags.get("name")

        if el["type"] == "node":
            h_lat = el.get("lat")
            h_lon = el.get("lon")
        else:
            center = el.get("center", {})
            h_lat = center.get("lat")
            h_lon = center.get("lon")

        if name and h_lat is not None and h_lon is not None:
            dist_km = distance_haversine(lat_gare, lon_gare, h_lat, h_lon)
            dist_km = round(dist_km, 2)
            hotels.append(
                {
                    "name": name,
                    "lat": h_lat,
                    "lon": h_lon,
                    "distance_km_from_station": dist_km,
                }
            )

    hotels.sort(key=lambda x: x["distance_km_from_station"])
    return hotels


def get_bike_stations_near(lat_gare: float, lon_gare: float, radius_m: int = 500):
    """
    Retourne une liste de stations vélo en libre-service (Bicloo, Vélib, etc.) OSM proches :
    [{name, lat, lon, distance_km_from_station, type}, ...]
    """
    query = f"""
    [out:json];
    (
      node["amenity"="bicycle_rental"](around:{radius_m},{lat_gare},{lon_gare});
      way["amenity"="bicycle_rental"](around:{radius_m},{lat_gare},{lon_gare});
      relation["amenity"="bicycle_rental"](around:{radius_m},{lat_gare},{lon_gare});
    );
    out center;
    """
    cache_key = f"bikes_{lat_gare:.4f}_{lon_gare:.4f}_{radius_m}"
    data = overpass_query_cached(query, cache_key, timeout=25)

    stations = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = tags.get("name")
        amenity_type = tags.get("amenity")

        if el["type"] == "node":
            s_lat = el.get("lat")
            s_lon = el.get("lon")
        else:
            center = el.get("center", {})
            s_lat = center.get("lat")
            s_lon = center.get("lon")

        if s_lat is None or s_lon is None:
            continue

        dist_km = distance_haversine(lat_gare, lon_gare, s_lat, s_lon)
        dist_km = round(dist_km, 2)

        stations.append(
            {
                "name": name,
                "lat": s_lat,
                "lon": s_lon,
                "distance_km_from_station": dist_km,
                "type": amenity_type,
            }
        )

    stations.sort(key=lambda x: x["distance_km_from_station"])
    return stations


def get_activities_near(lat_gare: float, lon_gare: float, radius_m: int = 2000):
    """
    Retourne une liste d'activités OSM proches :
    [{name, lat, lon, distance_km_from_station, category}, ...]
    """
    print(f"[DEBUG] Recherche activites autour de ({lat_gare}, {lon_gare}) rayon={radius_m}m")
    query = f"""
    [out:json];
    (
      node["tourism"~"museum|attraction|gallery|viewpoint"](around:{radius_m},{lat_gare},{lon_gare});
      way["tourism"~"museum|attraction|gallery|viewpoint"](around:{radius_m},{lat_gare},{lon_gare});
      relation["tourism"~"museum|attraction|gallery|viewpoint"](around:{radius_m},{lat_gare},{lon_gare});
      node["leisure"~"park|pitch|sports_centre|stadium|swimming_pool"](around:{radius_m},{lat_gare},{lon_gare});
      way["leisure"~"park|pitch|sports_centre|stadium|swimming_pool"](around:{radius_m},{lat_gare},{lon_gare});
      relation["leisure"~"park|pitch|sports_centre|stadium|swimming_pool"](around:{radius_m},{lat_gare},{lon_gare});
      node["amenity"~"restaurant|cafe|bar|pub|fast_food|cinema|theatre"](around:{radius_m},{lat_gare},{lon_gare});
      way["amenity"~"restaurant|cafe|bar|pub|fast_food|cinema|theatre"](around:{radius_m},{lat_gare},{lon_gare});
      relation["amenity"~"restaurant|cafe|bar|pub|fast_food|cinema|theatre"](around:{radius_m},{lat_gare},{lon_gare});
    );
    out center;
    """
    cache_key = f"activities_{lat_gare:.4f}_{lon_gare:.4f}_{radius_m}"
    data = overpass_query_cached(query, cache_key, timeout=30)
    print(f"[DEBUG] Overpass a retourne {len(data.get('elements', []))} elements")

    activities = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = tags.get("name")
        tourism = tags.get("tourism")
        leisure = tags.get("leisure")
        amenity = tags.get("amenity")

        if el["type"] == "node":
            a_lat = el.get("lat")
            a_lon = el.get("lon")
        else:
            center = el.get("center", {})
            a_lat = center.get("lat")
            a_lon = center.get("lon")

        if a_lat is None or a_lon is None:
            continue

        dist_km = distance_haversine(lat_gare, lon_gare, a_lat, a_lon)
        dist_km = round(dist_km, 2)

        category = tourism or leisure or amenity

        activities.append(
            {
                "name": name,
                "lat": a_lat,
                "lon": a_lon,
                "distance_km_from_station": dist_km,
                "category": category,
                "raw_tags": tags,
            }
        )

    activities.sort(key=lambda x: x["distance_km_from_station"])
    # Limite à 50 résultats max pour éviter les timeouts
    return activities[:50]


@app.get("/trajet")
def trajet(
        from_city: str = Query(..., description="Nom gare départ"),
        to_city: str = Query(..., description="Nom gare arrivée"),
):
    from_code = None
    to_code = None
    prix_moyen = None
    distance = None
    train_co2 = None
    voiture_co2 = None
    journey = None
    lat_dep = lon_dep = lat_arr = lon_arr = None
    duree = None
    hotels_proches = []
    stations_velo_proches = []
    activites_proches = []

    # Récup codes UIC
    try:
        from_code = get_code_uic(from_city)
    except Exception:
        from_code = None

    try:
        to_code = get_code_uic(to_city)
    except Exception:
        to_code = None

    if from_code and to_code:
        # Prix moyen
        try:
            lignes = df_tarif[
                (df_tarif["Gare origine - code UIC"] == from_code)
                & (df_tarif["Gare destination - code UIC"] == to_code)
            ]
            if not lignes.empty:
                prix_min = lignes["Prix minimum"].mean()
                prix_max = lignes["Prix maximum"].mean()
                prix_moyen = (prix_min + prix_max) / 2
        except Exception:
            prix_moyen = None

        # Journey API SNCF
        try:
            journey = get_full_journey(from_code, to_code)
        except Exception:
            journey = None

        # CO2 + distance
        try:
            co2_ligne = df_co2[
                (df_co2["Origine_uic"] == from_code)
                & (df_co2["Destination_uic"] == to_code)
            ]
            if not co2_ligne.empty:
                distance = co2_ligne["Distance entre les gares"].values[0]
                train_co2 = co2_ligne["Train - Empreinte carbone (kgCO2e)"].values[0]
                voiture_co2 = co2_ligne["Voiture thermique (2,2 pers.) - Empreinte carbone (kgCO2e)"].values[0]
                if pd.isnull(train_co2) and distance is not None:
                    train_co2 = estime_co2_train(distance)
                if pd.isnull(voiture_co2) and distance is not None:
                    voiture_co2 = estime_co2_voiture(distance)
            else:
                # Estimation via Haversine
                lat1, lon1 = get_coords(from_code)
                lat2, lon2 = get_coords(to_code)
                if None not in (lat1, lon1, lat2, lon2):
                    distance = distance_haversine(lat1, lon1, lat2, lon2)
                    train_co2 = estime_co2_train(distance)
                    voiture_co2 = estime_co2_voiture(distance)
        except Exception:
            pass

        # Coordonnées gares
        try:
            lat_dep, lon_dep = get_coords(from_code)
            lat_arr, lon_arr = get_coords(to_code)
            print(f"[DEBUG] Coordonnees arrivee: lat={lat_arr}, lon={lon_arr}")
        except Exception as e:
            print(f"[ERROR] Erreur get_coords: {e}")
            lat_dep = lon_dep = lat_arr = lon_arr = None

        # Hôtels / vélos / activités proches de la gare d'arrivée
        if lat_arr is not None and lon_arr is not None:
            print(f"[DEBUG] Recherche POI autour de la gare d'arrivee...")
            hotels_proches = get_hotels_near(lat_arr, lon_arr, radius_m=2000)
            stations_velo_proches = get_bike_stations_near(lat_arr, lon_arr, radius_m=1000)
            activites_proches = get_activities_near(lat_arr, lon_arr, radius_m=2000)
            print(f"[DEBUG] Resultats: {len(hotels_proches)} hotels, {len(stations_velo_proches)} velos, {len(activites_proches)} activites")
        else:
            print(f"[WARNING] Coordonnees arrivee non trouvees, pas de recherche POI")

    # Durée formatée
    if journey:
        total_duration = journey.get("duration", 0)
        hours = total_duration // 3600
        minutes = (total_duration % 3600) // 60
        duree = f"{hours}h{minutes}mn"

    # Arrondi de la distance
    if distance is not None:
        distance = round(float(distance), 2)

    return {
        "from_city": from_city,
        "to_city": to_city,
        "distance_km": distance,
        "duree": duree,
        "prix_moyen": prix_moyen,
        "co2_train_kg": train_co2,
        "co2_voiture_kg": voiture_co2,
        "coordonnees_depart": {"latitude": lat_dep, "longitude": lon_dep},
        "coordonnees_arrivee": {"latitude": lat_arr, "longitude": lon_arr},
        "hotels_proches": hotels_proches,
        "stations_velo_proches": stations_velo_proches,
        "activites_proches": activites_proches,
        "trajet_api_sncf_detail": journey,
    }
