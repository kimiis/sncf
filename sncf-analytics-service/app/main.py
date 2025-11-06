from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import HTMLResponse
import pandas as pd
import base64
import requests
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2

app = FastAPI()

# Chemins vers fichiers Excel
tarif_file = "tarifs-tgv.xlsx"
co2_file = "emission-co2-perimetre-usage.xlsx"
gares_file = "gares.xlsx"

# Chargement données Excel
df_tarif = pd.read_excel(tarif_file)
df_tarif.dropna(subset=['Gare origine', 'Gare destination',
                        'Gare origine - code UIC', 'Gare destination - code UIC'], inplace=True)

df_co2 = pd.read_excel(co2_file)
df_co2.dropna(subset=['Origine_uic', 'Destination_uic'], inplace=True)

df_gares = pd.read_excel(gares_file)

# Auth API SNCF
api_key = '2d5f9bc9-9eb2-471b-bba8-24d542cf79ae'
token = base64.b64encode(f"{api_key}:".encode()).decode()
headers = {'Authorization': f'Basic {token}'}

@app.get("/gares")
def get_gares():
    gares = sorted(df_gares['LIBELLE'].dropna().unique().tolist())
    return {"gares": gares}

@app.get("/autocomplete")
def autocomplete(q: str = ''):
    if not q or len(q.strip()) < 2:
        return []
    q_lower = q.lower()
    resultats = [gare for gare in df_gares['LIBELLE'].unique() if q_lower in gare.lower()]
    return {"gares": resultats[:10]}

@app.get("/", response_class=HTMLResponse)
def root():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
      <title>Recherche gares avec complétion</title>
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


def get_code_uic(station_name):
    serie = df_gares.loc[df_gares['LIBELLE'].str.lower() == station_name.lower(), 'CODE_UIC']
    if len(serie) == 0:
        return None
    return int(serie.values[0])

def get_coords(code_uic):
    geo = df_gares.loc[df_gares['CODE_UIC'] == code_uic, 'Geo Point'].values
    if len(geo) == 0:
        return None, None
    latlon_str = geo[0]
    if isinstance(latlon_str, str) and ',' in latlon_str:
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
    a = sin(dlat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c

def estime_co2_train(distance_km):
    return 0.0194 * distance_km

def estime_co2_voiture(distance_km):
    return 0.122 * distance_km

def get_full_journey(from_code, to_code):
    now = datetime.now().strftime('%Y%m%dT%H%M%S')
    params = {
        'from': f'stop_area:SNCF:{from_code}',
        'to': f'stop_area:SNCF:{to_code}',
        'datetime': now
    }
    response = requests.get('https://api.sncf.com/v1/coverage/sncf/journeys',
                            params=params, headers=headers)
    if response.status_code != 200:
        return None
    data = response.json()
    journeys = data.get('journeys', [])
    if not journeys:
        return None
    return journeys[0]

@app.get("/trajet")
def trajet(from_city: str = Query(..., description="Nom gare départ"),
           to_city: str = Query(..., description="Nom gare arrivée")):

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
        pass

    try:
        to_code = get_code_uic(to_city)
    except Exception:
        pass

    if from_code and to_code:
        try:
            lignes = df_tarif[(df_tarif['Gare origine - code UIC'] == from_code) & (df_tarif['Gare destination - code UIC'] == to_code)]
            if not lignes.empty:
                prix_min = lignes['Prix minimum'].mean()
                prix_max = lignes['Prix maximum'].mean()
                prix_moyen = (prix_min + prix_max) / 2
        except Exception:
            pass

        try:
            journey = get_full_journey(from_code, to_code)
        except Exception:
            journey = None

        try:
            co2_ligne = df_co2[(df_co2['Origine_uic'] == from_code) & (df_co2['Destination_uic'] == to_code)]
            if not co2_ligne.empty:
                distance = co2_ligne["Distance entre les gares"].values[0]
                train_co2 = co2_ligne["Train - Empreinte carbone (kgCO2e)"].values[0]
                voiture_co2 = co2_ligne["Voiture thermique (2,2 pers.) - Empreinte carbone (kgCO2e)"].values[0]
                if pd.isnull(train_co2):
                    train_co2 = estime_co2_train(distance)
                if pd.isnull(voiture_co2):
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

        try:
            lat_dep, lon_dep = get_coords(from_code)
            lat_arr, lon_arr = get_coords(to_code)
        except Exception:
            lat_dep = lon_dep = lat_arr = lon_arr = None

    if journey:
        total_duration = journey.get('duration', 0)
        hours = total_duration // 3600
        minutes = (total_duration % 3600) // 60
        duree = f"{hours}h{minutes}mn"

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
        "trajet_api_sncf_detail": journey
    }
