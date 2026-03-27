from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import pandas as pd
import base64
import requests
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2
import os
import time
import random
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

app = FastAPI()

# Strip le préfixe /api quand FastAPI est appelé via Vercel
class StripApiPrefix(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.scope["path"].startswith("/api/"):
            request.scope["path"] = request.scope["path"][4:]
            request.scope["raw_path"] = request.scope["path"].encode()
        return await call_next(request)

app.add_middleware(StripApiPrefix)

# Cache simple pour éviter les requêtes Overpass répétées (rate limiting 429)
overpass_cache = {}
CACHE_DURATION = 300  # 5 minutes

# OpenTripMap
OPENTRIPMAP_API_KEY = os.getenv("OPENTRIPMAP_API_KEY", "")
OPENTRIPMAP_BASE = "https://api.opentripmap.com/0.1/fr"
destinations_cache = {"data": None, "time": 0}
DESTINATIONS_CACHE_TTL = 3600  # 1h

# Coordonnées et tags définis statiquement — fiables et sans dépendance externe
FRENCH_CITIES = [
    {"name": "Annecy",      "region": "Auvergne-Rhône-Alpes",       "lat": 45.8992, "lon":  6.1294, "tags": ["montagne", "nature"]},
    {"name": "Nice",        "region": "Provence-Alpes-Côte d'Azur", "lat": 43.7102, "lon":  7.2620, "tags": ["mer", "culture"]},
    {"name": "Bordeaux",    "region": "Nouvelle-Aquitaine",          "lat": 44.8378, "lon": -0.5792, "tags": ["gastronomie", "culture"]},
    {"name": "Lyon",        "region": "Auvergne-Rhône-Alpes",       "lat": 45.7640, "lon":  4.8357, "tags": ["gastronomie", "culture"]},
    {"name": "Strasbourg",  "region": "Grand Est",                   "lat": 48.5734, "lon":  7.7521, "tags": ["culture"]},
    {"name": "La Rochelle", "region": "Nouvelle-Aquitaine",          "lat": 46.1591, "lon": -1.1520, "tags": ["mer", "culture"]},
    {"name": "Marseille",   "region": "Provence-Alpes-Côte d'Azur", "lat": 43.2965, "lon":  5.3698, "tags": ["mer", "nature"]},
    {"name": "Biarritz",    "region": "Nouvelle-Aquitaine",          "lat": 43.4832, "lon": -1.5586, "tags": ["mer", "nature"]},
    {"name": "Montpellier", "region": "Occitanie",                   "lat": 43.6108, "lon":  3.8767, "tags": ["mer", "culture"]},
    {"name": "Colmar",      "region": "Grand Est",                   "lat": 48.0793, "lon":  7.3585, "tags": ["culture", "gastronomie"]},
    {"name": "Nantes",      "region": "Pays de la Loire",            "lat": 47.2184, "lon": -1.5536, "tags": ["culture"]},
    {"name": "Rennes",      "region": "Bretagne",                    "lat": 48.1147, "lon": -1.6794, "tags": ["culture", "gastronomie"]},
    {"name": "Avignon",     "region": "Provence-Alpes-Côte d'Azur", "lat": 43.9493, "lon":  4.8055, "tags": ["culture"]},
    {"name": "Grenoble",    "region": "Auvergne-Rhône-Alpes",       "lat": 45.1885, "lon":  5.7245, "tags": ["montagne", "nature"]},
    {"name": "Tours",       "region": "Centre-Val de Loire",         "lat": 47.3941, "lon":  0.6848, "tags": ["culture"]},
    {"name": "Toulouse",    "region": "Occitanie",                   "lat": 43.6047, "lon":  1.4442, "tags": ["culture", "gastronomie"]},
    {"name": "Saint-Malo",  "region": "Bretagne",                    "lat": 48.6493, "lon": -2.0256, "tags": ["mer", "culture"]},
    {"name": "Cannes",      "region": "Provence-Alpes-Côte d'Azur", "lat": 43.5528, "lon":  7.0174, "tags": ["mer", "culture"]},
    {"name": "Chamonix",    "region": "Auvergne-Rhône-Alpes",       "lat": 45.9237, "lon":  6.8694, "tags": ["montagne", "nature"]},
    {"name": "Bayonne",     "region": "Nouvelle-Aquitaine",          "lat": 43.4929, "lon": -1.4748, "tags": ["mer", "gastronomie"]},
]

KINDS_TAGS = {
    "mer":         ["beach", "sea", "marine", "coast", "harbour"],
    "montagne":    ["mountain", "ski", "alpine", "peak", "highland"],
    "nature":      ["natural", "park", "nature", "forest", "waterfall", "garden", "botanical", "lake"],
    "culture":     ["museum", "cultural", "historic", "architecture", "gallery", "theatre", "heritage", "castle", "ruins"],
    "gastronomie": ["food", "restaurant", "gastro", "wine", "cuisine", "market"],
}


def otm_kinds_to_tags(kinds_str):
    tags = set()
    kinds = kinds_str.lower() if kinds_str else ""
    for tag, keywords in KINDS_TAGS.items():
        if any(k in kinds for k in keywords):
            tags.add(tag)
    return list(tags) if tags else ["culture"]


def get_wikipedia_image(city_name):
    """
    Récupère l'image principale d'une ville via l'API REST Wikimedia.
    Essaie Wikipedia EN (meilleures photos), puis FR en fallback.
    """
    # Noms alternatifs anglais pour certaines villes françaises
    en_names = {
        "La Rochelle": "La_Rochelle",
        "Saint-Malo": "Saint-Malo",
        "Avignon": "Avignon",
    }
    en_name = en_names.get(city_name, city_name).replace(" ", "_")

    for lang in ("en", "fr"):
        name = en_name if lang == "en" else city_name.replace(" ", "_")
        try:
            resp = requests.get(
                f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{requests.utils.quote(name)}",
                headers={"User-Agent": "GoEco-TrainApp/1.0"},
                timeout=6,
            )
            if resp.status_code == 200:
                data = resp.json()
                # Préférer originalimage (haute résolution) puis thumbnail
                src = (
                    data.get("originalimage", {}).get("source")
                    or data.get("thumbnail", {}).get("source")
                )
                if src:
                    print(f"[WIKI] {city_name} image trouvée ({lang})")
                    return src
        except Exception:
            pass
    print(f"[WIKI] {city_name} aucune image trouvée")
    return None


def get_wikipedia_description(city_name):
    """Récupère la première phrase de l'intro Wikipedia d'une ville."""
    try:
        resp = requests.get(
            "https://fr.wikipedia.org/w/api.php",
            params={
                "action": "query",
                "titles": city_name,
                "prop": "extracts",
                "exintro": True,
                "explaintext": True,
                "exsentences": 1,
                "format": "json",
                "redirects": 1,
            },
            timeout=5,
        )
        pages = resp.json().get("query", {}).get("pages", {})
        for page in pages.values():
            extract = page.get("extract", "").strip()
            if extract and len(extract) > 20:
                # Couper à 80 caractères max pour la carte
                return extract[:80].rsplit(" ", 1)[0] + "…" if len(extract) > 80 else extract
    except Exception:
        pass
    return None


def fetch_city_destination(idx, city):
    """Récupère image Wikipedia + top lieux OTM pour une ville. Coords et tags sont statiques."""
    city_name = city["name"]
    region = city.get("region", "")
    lat = city["lat"]
    lon = city["lon"]
    tags = city["tags"]
    try:
        time.sleep(0.4)

        # 1. Lieux emblématiques via OpenTripMap (coords statiques, pas de geoname)
        places = []
        if OPENTRIPMAP_API_KEY:
            places_resp = requests.get(
                f"{OPENTRIPMAP_BASE}/places/radius",
                params={
                    "radius": 10000,
                    "lon": lon,
                    "lat": lat,
                    "kinds": "interesting_places",
                    "format": "json",
                    "limit": 8,
                    "apikey": OPENTRIPMAP_API_KEY,
                },
                timeout=8,
            )
            if places_resp.status_code == 200:
                data = places_resp.json()
                places = data if isinstance(data, list) else []

        # 2. Description : top lieux OTM ou Wikipedia en fallback
        top_names = [p["name"] for p in places if p.get("name") and p["name"].strip()][:2]
        if top_names:
            description = f"Découvrez {' et '.join(top_names)}"
        else:
            description = get_wikipedia_description(city_name) or f"Escapade à {city_name} en train"

        # 3. Image Wikipedia
        image = get_wikipedia_image(city_name)
        print(f"[DEST] {city_name} OK — tags={tags}, image={'oui' if image else 'non'}")

        return {
            "id": idx + 1,
            "name": city_name,
            "description": description,
            "region": region,
            "image": image,
            "tags": tags,
        }
    except Exception as e:
        print(f"[DEST] Erreur {city_name}: {e}")
        return None

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Chemin vers la racine du projet — robuste quel que soit l'environnement
_this_file = os.path.abspath(__file__)
_api_app_dir = os.path.dirname(_this_file)       # api/app/
_api_dir     = os.path.dirname(_api_app_dir)      # api/
_root_candidate = os.path.dirname(_api_dir)       # racine (local et Vercel)
# Sur Vercel, /var/task est la racine du repo
ROOT_DIR = _root_candidate if os.path.isdir(os.path.join(_root_candidate, "Data")) else "/var/task"

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
# print(f"[STARTUP] tarifs: {df_tarif.shape}")

# print(f"[STARTUP] Chargement de {co2_file}...")
df_co2 = pd.read_excel(co2_file)
df_co2.dropna(subset=["Origine_uic", "Destination_uic"], inplace=True)
# print(f"[STARTUP] co2: {df_co2.shape}")
#
# print(f"[STARTUP] Chargement de {gares_file}...")
df_gares = pd.read_excel(gares_file)
# print(f"[STARTUP] gares: {df_gares.shape}")

# Auth API SNCF
api_key = os.getenv("SNCF_API_KEY", "2d5f9bc9-9eb2-471b-bba8-24d542cf79ae")
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
        # print(f"[ERROR] Erreur Overpass: {e}")
        # Retourner le cache expiré si disponible
        if cache_key in overpass_cache:
            print(f"[CACHE] Utilisation du cache expiré pour {cache_key}")
            return overpass_cache[cache_key][0]
        return {"elements": []}


@app.get("/gares")
def get_gares():
    gares = sorted(df_gares["LIBELLE"].dropna().unique().tolist())
    return {"gares": gares}


@app.get("/gare-proche")
def gare_proche(lat: float = Query(...), lon: float = Query(...)):
    """Retourne la gare la plus proche des coordonnées GPS données."""
    best_name = None
    best_dist = float("inf")
    for _, row in df_gares.dropna(subset=["LIBELLE", "Geo Point"]).iterrows():
        geo = row["Geo Point"]
        if not isinstance(geo, str) or "," not in geo:
            continue
        try:
            g_lat, g_lon = [float(x.strip()) for x in geo.split(",")]
            d = distance_haversine(lat, lon, g_lat, g_lon)
            if d < best_dist:
                best_dist = d
                best_name = row["LIBELLE"]
        except Exception:
            continue
    return {"gare": best_name, "distance_km": round(best_dist, 1)}


@app.get("/autocomplete")
def autocomplete(q: str = ""):
    # print(f"[DEBUG] autocomplete appelé avec q={q}")
    # print(f"[DEBUG] df_gares shape: {df_gares.shape}")
    q_lower = q.lower()
    # print(f"[DEBUG] Recherche en cours...")
    resultats = [
        gare
        for gare in df_gares["LIBELLE"].dropna().unique()
        if q_lower in gare.lower()
    ]
    # print(f"[DEBUG] {len(resultats)} résultats trouvés")
    return resultats[:10]




def get_code_uic(station_name: str):
    name_lower = station_name.lower().strip()
    libelles = df_gares["LIBELLE"].str.lower()

    # 1. Match exact
    serie = df_gares.loc[libelles == name_lower, "CODE_UIC"]
    if len(serie) > 0:
        return int(serie.values[0])

    # 2. La gare commence par le nom saisi (ex: "Toulouse" → "Toulouse-Matabiau")
    serie = df_gares.loc[libelles.str.startswith(name_lower), "CODE_UIC"]
    if len(serie) > 0:
        return int(serie.values[0])

    # 3. Contient le nom saisi
    serie = df_gares.loc[libelles.str.contains(name_lower, na=False), "CODE_UIC"]
    if len(serie) > 0:
        return int(serie.values[0])

    return None


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


def estime_co2_avion(distance_km: float):
    # 0.255 kg CO2/km par passager (ADEME) — seulement pertinent > 300 km
    return 0.255 * distance_km


def get_full_journey(from_code: int, to_code: int):
    now = datetime.now().strftime("%Y%m%dT%H%M%S")
    params = {
        "from": f"stop_area:SNCF:{from_code}",
        "to": f"stop_area:SNCF:{to_code}",
        "datetime": now,
        "count": 5,
    }
    response = requests.get(
        "https://api.sncf.com/v1/coverage/sncf/journeys",
        params=params,
        headers=headers,
    )
    if response.status_code != 200:
        return None, []
    data = response.json()
    journeys = data.get("journeys", [])
    if not journeys:
        return None, []
    return journeys[0], journeys[:3]


def format_journey_summary(journey: dict) -> dict:
    """Résumé d'un journey pour l'affichage multi-trajets."""
    if not journey:
        return {}
    total_duration = journey.get("duration", 0)
    dep = journey.get("departure_date_time", "")
    arr = journey.get("arrival_date_time", "")
    hours = total_duration // 3600
    minutes = (total_duration % 3600) // 60
    return {
        "duree": f"{hours}h{minutes:02d}mn",
        "depart": dep[9:13] if len(dep) >= 13 else "",
        "arrivee": arr[9:13] if len(arr) >= 13 else "",
        "nb_changements": sum(1 for s in journey.get("sections", []) if s.get("type") == "transfer"),
    }


def extract_route_coordinates(journey):
    """
    Extrait les coordonnées GPS du tracé du train depuis les données de l'API SNCF.
    Retourne une liste de [latitude, longitude] pour tracer le parcours réel.
    """
    if not journey:
        return []

    coordinates = []
    sections = journey.get("sections", [])

    for section in sections:
        # Récupérer les coordonnées depuis le geojson de la section
        geojson = section.get("geojson", {})
        if geojson and geojson.get("type") == "LineString":
            coords = geojson.get("coordinates", [])
            # GeoJSON utilise [lon, lat], on inverse pour Leaflet [lat, lon]
            for coord in coords:
                if len(coord) >= 2:
                    coordinates.append([coord[1], coord[0]])

    return coordinates

def get_hotels_near(
        lat_gare: float,
        lon_gare: float,
        radius_m: int = 1500,
        limit: int = 20,
):
    """
    Retourne une liste d'hébergements OSM proches (hôtels, auberges, B&B, etc.).
    [{name, lat, lon, distance_km_from_station}, ...]
    """
    query = f"""
    [out:json][timeout:25];
    (
      node["tourism"~"^(hotel|hostel|motel|guest_house|bed_and_breakfast)$"](around:{radius_m},{lat_gare},{lon_gare});
      way["tourism"~"^(hotel|hostel|motel|guest_house|bed_and_breakfast)$"](around:{radius_m},{lat_gare},{lon_gare});
    );
    out center {limit};
    """
    cache_key = f"hotels_{lat_gare:.4f}_{lon_gare:.4f}_{radius_m}_{limit}"
    data = overpass_query_cached(query, cache_key, timeout=25)

    hotels = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = tags.get("name") or "Hôtel"

        if el.get("type") == "way":
            center = el.get("center", {})
            h_lat = center.get("lat")
            h_lon = center.get("lon")
        else:
            h_lat = el.get("lat")
            h_lon = el.get("lon")

        if h_lat is None or h_lon is None:
            continue

        dist_km = round(distance_haversine(lat_gare, lon_gare, h_lat, h_lon), 2)
        hotels.append({
            "name": name,
            "lat": h_lat,
            "lon": h_lon,
            "distance_km_from_station": dist_km,
        })

    hotels.sort(key=lambda x: x["distance_km_from_station"])
    return hotels

def get_bike_stations_near(
        lat_gare: float,
        lon_gare: float,
        radius_m: int = 1000,
        limit: int = 80,
):
    """
    Retourne une liste de stations vélo (location et parking).
    [{name, lat, lon, distance_km_from_station, type}, ...]
    """
    query = f"""
    [out:json][timeout:25];
    (
      node["amenity"~"^(bicycle_rental|bicycle_parking)$"](around:{radius_m},{lat_gare},{lon_gare});
      way["amenity"~"^(bicycle_rental|bicycle_parking)$"](around:{radius_m},{lat_gare},{lon_gare});
    );
    out center {limit};
    """
    cache_key = f"bikes_{lat_gare:.4f}_{lon_gare:.4f}_{radius_m}_{limit}"
    data = overpass_query_cached(query, cache_key, timeout=25)

    stations = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = tags.get("name", "Station vélo")
        amenity_type = tags.get("amenity", "bicycle_rental")

        # Pour les ways, utiliser 'center', pour les nodes utiliser lat/lon directement
        if el.get("type") == "way":
            center = el.get("center", {})
            s_lat = center.get("lat")
            s_lon = center.get("lon")
        else:
            s_lat = el.get("lat")
            s_lon = el.get("lon")

        if s_lat is None or s_lon is None:
            continue

        dist_km = round(distance_haversine(lat_gare, lon_gare, s_lat, s_lon), 2)

        stations.append({
            "name": name,
            "lat": s_lat,
            "lon": s_lon,
            "distance_km_from_station": dist_km,
            "type": amenity_type,
        })

    stations.sort(key=lambda x: x["distance_km_from_station"])
    return stations

def get_parkings_near(lat_gare: float, lon_gare: float, radius_m: int = 800, limit: int = 10):
    """
    Retourne une liste de parkings OSM proches.
    [{name, lat, lon, distance_km_from_station, capacity, fee}, ...]
    """
    query = f"""
    [out:json][timeout:25];
    (
      node["amenity"="parking"](around:{radius_m},{lat_gare},{lon_gare});
      way["amenity"="parking"](around:{radius_m},{lat_gare},{lon_gare});
    );
    out center {limit};
    """
    cache_key = f"parkings_{lat_gare:.4f}_{lon_gare:.4f}_{radius_m}_{limit}"
    data = overpass_query_cached(query, cache_key, timeout=25)

    parkings = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = tags.get("name", "Parking")
        capacity = tags.get("capacity")
        fee = tags.get("fee", "unknown")

        # Pour les ways, utiliser 'center', pour les nodes utiliser lat/lon directement
        if el.get("type") == "way":
            center = el.get("center", {})
            p_lat = center.get("lat")
            p_lon = center.get("lon")
        else:
            p_lat = el.get("lat")
            p_lon = el.get("lon")

        if p_lat is None or p_lon is None:
            continue

        dist_km = round(distance_haversine(lat_gare, lon_gare, p_lat, p_lon), 2)
        parkings.append({
            "name": name,
            "lat": p_lat,
            "lon": p_lon,
            "distance_km_from_station": dist_km,
            "capacity": capacity,
            "fee": fee,
        })

    parkings.sort(key=lambda x: x["distance_km_from_station"])
    return parkings

def get_activities_near(
        lat_gare: float,
        lon_gare: float,
        radius_m: int = 1200,
        limit: int = 20,
):
    """
    Activités OSM proches
    [{name, lat, lon, distance_km_from_station, category}, ...]
    """
    # print(f"[DEBUG] Recherche activites autour de ({lat_gare}, {lon_gare}) rayon={radius_m}m")
    query = f"""
    [out:json][timeout:25];
    (
      node(around:{radius_m},{lat_gare},{lon_gare})["tourism"~"^(museum|attraction|gallery|viewpoint)$"];
      way(around:{radius_m},{lat_gare},{lon_gare})["tourism"~"^(museum|attraction|gallery|viewpoint)$"];
      node(around:{radius_m},{lat_gare},{lon_gare})["leisure"~"^(park|pitch|sports_centre|stadium|swimming_pool)$"];
      way(around:{radius_m},{lat_gare},{lon_gare})["leisure"~"^(park|pitch|sports_centre|stadium|swimming_pool)$"];
      node(around:{radius_m},{lat_gare},{lon_gare})["amenity"~"^(restaurant|cafe|bar|pub|fast_food|cinema|theatre)$"];
      way(around:{radius_m},{lat_gare},{lon_gare})["amenity"~"^(restaurant|cafe|bar|pub|fast_food|cinema|theatre)$"];
    );
    out center {limit};
    """

    cache_key = f"activities_{lat_gare:.4f}_{lon_gare:.4f}_{radius_m}_{limit}"
    data = overpass_query_cached(query, cache_key, timeout=25)
    # print(f"[DEBUG] Overpass a retourne {len(data.get('elements', []))} elements")

    activities = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = tags.get("name", "Activité")
        tourism = tags.get("tourism")
        leisure = tags.get("leisure")
        amenity = tags.get("amenity")

        # Pour les ways, utiliser 'center', pour les nodes utiliser lat/lon directement
        if el.get("type") == "way":
            center = el.get("center", {})
            a_lat = center.get("lat")
            a_lon = center.get("lon")
        else:
            a_lat = el.get("lat")
            a_lon = el.get("lon")

        if a_lat is None or a_lon is None:
            continue

        dist_km = round(distance_haversine(lat_gare, lon_gare, a_lat, a_lon), 2)
        category = tourism or leisure or amenity

        activities.append({
            "name": name,
            "lat": a_lat,
            "lon": a_lon,
            "distance_km_from_station": dist_km,
            "category": category,
            # "raw_tags": tags,  # <-- enlève si tu veux alléger la réponse API aussi
        })

    activities.sort(key=lambda x: x["distance_km_from_station"])
    return activities[:20]


@app.get("/trajet")
def trajet(
        from_city: str = Query(..., description="Nom gare départ"),
        to_city: str = Query(..., description="Nom gare arrivée"),
):
    """Retourne les infos du trajet (prix, CO2, durée, coords) sans appels Overpass."""
    from_code = None
    to_code = None
    prix_moyen = None
    distance = None
    train_co2 = None
    voiture_co2 = None
    journey = None
    lat_dep = lon_dep = lat_arr = lon_arr = None
    duree = None

    try:
        from_code = get_code_uic(from_city)
    except Exception:
        from_code = None

    try:
        to_code = get_code_uic(to_city)
    except Exception:
        to_code = None

    journeys_list = []
    if from_code and to_code:
        # Prix moyen (indicatif — source SNCF Open Data)
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
            journey, journeys_list = get_full_journey(from_code, to_code)
        except Exception:
            journey, journeys_list = None, []

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
        except Exception:
            lat_dep = lon_dep = lat_arr = lon_arr = None

    # Durée formatée
    if journey:
        total_duration = journey.get("duration", 0)
        hours = total_duration // 3600
        minutes = (total_duration % 3600) // 60
        duree = f"{hours}h{minutes}mn"

    if distance is not None:
        distance = round(float(distance), 2)

    avion_co2 = round(estime_co2_avion(distance), 2) if distance and distance > 300 else None
    route_coordinates = extract_route_coordinates(journey)
    prochains_departs = [format_journey_summary(j) for j in journeys_list]

    return {
        "from_city": from_city,
        "to_city": to_city,
        "distance_km": distance,
        "duree": duree,
        "prix_indicatif": prix_moyen,
        "co2_train_kg": train_co2,
        "co2_voiture_kg": voiture_co2,
        "co2_avion_kg": avion_co2,
        "coordonnees_depart": {"latitude": lat_dep, "longitude": lon_dep},
        "coordonnees_arrivee": {"latitude": lat_arr, "longitude": lon_arr},
        "route_coordinates": route_coordinates,
        "prochains_departs": prochains_departs,
        "trajet_api_sncf_detail": journey,
    }


@app.get("/trajet/poi")
def trajet_poi(
        lat_arr: float = Query(..., description="Latitude gare arrivée"),
        lon_arr: float = Query(..., description="Longitude gare arrivée"),
        lat_dep: float = Query(..., description="Latitude gare départ"),
        lon_dep: float = Query(..., description="Longitude gare départ"),
):
    """Retourne les POI proches des gares (appels Overpass, peut être lent)."""
    hotels_proches = get_hotels_near(lat_arr, lon_arr, radius_m=1200)
    stations_velo_proches = get_bike_stations_near(lat_arr, lon_arr, radius_m=800)
    activites_proches = get_activities_near(lat_arr, lon_arr, radius_m=1200)
    parkings_proches = get_parkings_near(lat_dep, lon_dep, radius_m=800)

    return {
        "hotels_proches": hotels_proches,
        "stations_velo_proches": stations_velo_proches,
        "activites_proches": activites_proches,
        "parkings_proches": parkings_proches,
    }


def _static_destinations():
    """Liste statique avec images Wikipedia — fallback si pas de clé OpenTripMap."""
    result = []
    for idx, city in enumerate(FRENCH_CITIES):
        image = get_wikipedia_image(city["name"])
        desc = get_wikipedia_description(city["name"]) or f"Escapade à {city['name']} en train"
        result.append({
            "id": idx + 1,
            "name": city["name"],
            "description": desc,
            "region": city["region"],
            "image": image,
            "tags": city["tags"],
        })
        time.sleep(0.2)
    shuffled = result.copy()
    random.shuffle(shuffled)
    return shuffled


@app.get("/sncf/destinations")
def get_destinations():
    """
    Retourne des destinations en France via OpenTripMap + images Wikipedia.
    Cache 1h. Fallback sur liste statique si pas de clé API.
    """
    now = time.time()

    # Servir depuis le cache si encore valide
    if destinations_cache["data"] and (now - destinations_cache["time"]) < DESTINATIONS_CACHE_TTL:
        shuffled = destinations_cache["data"].copy()
        random.shuffle(shuffled)
        return shuffled

    # Sans clé OpenTripMap : fallback statique (images Wikipedia quand même)
    if not OPENTRIPMAP_API_KEY:
        print("[OTM] Pas de clé API, utilisation de la liste statique")
        return _static_destinations()

    # Appels OpenTripMap
    result = []
    for idx, city in enumerate(FRENCH_CITIES):
        dest = fetch_city_destination(idx, city)
        if dest:
            result.append(dest)

    # Si trop peu de résultats, fallback
    if len(result) < 5:
        print("[OTM] Trop peu de résultats, fallback statique")
        return _static_destinations()

    destinations_cache["data"] = result
    destinations_cache["time"] = now

    shuffled = result.copy()
    random.shuffle(shuffled)
    return shuffled
