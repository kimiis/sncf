import streamlit as st
import pandas as pd
import requests
import base64
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2
from streamlit_folium import st_folium
import folium

# Chemins relatifs
tarif_file = "../../DATA/DATALAKE/Processed/tarifs-tgv.xlsx"
co2_file = "../../DATA/DATALAKE/Processed/emission-co2-perimetre-usage.xlsx"
gares_file = "../../DATA/DATALAKE/Processed/gares.xlsx"

st.title("Trajets avec correspondances - Durée, prix, CO₂ & carte SNCF")

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

def get_coords(df_gares, code_uic):
    try:
        code_uic_int = int(code_uic)
    except (ValueError, TypeError):
        return None, None
    geo = df_gares.loc[df_gares['CODE_UIC'] == code_uic_int, 'Geo Point'].values
    if len(geo) > 0:
        latlon_str = geo[0]
        if isinstance(latlon_str, str) and ',' in latlon_str:
            lat, lon = [float(x.strip()) for x in latlon_str.split(",")]
            return lat, lon
    return None, None

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
    if response.status_code == 200:
        data = response.json()
        journeys = data.get('journeys', [])
        if journeys:
            journey = journeys[0]
            sections = journey.get('sections', [])
            legs_info = []
            for section in sections:
                if section.get('type') in ('public_transport', 'ride'):
                    from_sp = section['from']['stop_point']
                    to_sp = section['to']['stop_point']
                    legs_info.append({
                        'from_name': from_sp['name'],
                        'from_uic': from_sp['id'].split(':')[-1],
                        'to_name': to_sp['name'],
                        'to_uic': to_sp['id'].split(':')[-1],
                        'departure_time': section['from'].get('departure_date_time', ''),
                        'arrival_time': section['to'].get('arrival_date_time', ''),
                        'duration': section.get('duration', 0)
                    })
            return legs_info
    return None

df_tarif = pd.read_excel(tarif_file)
df_tarif.dropna(subset=['Gare origine', 'Gare destination',
                        'Gare origine - code UIC', 'Gare destination - code UIC'], inplace=True)
gares_list = sorted(set(df_tarif['Gare origine']) | set(df_tarif['Gare destination']))

df_co2 = pd.read_excel(co2_file)
df_co2.dropna(subset=['Origine_uic', 'Destination_uic'], inplace=True)

df_gares = pd.read_excel(gares_file)

# Valeurs par défaut
default_from = "Nantes"
default_to_options = [g for g in gares_list if "Montparnasse" in g]
default_to = default_to_options[0] if default_to_options else gares_list[0]

idx_from = gares_list.index(default_from) if default_from in gares_list else 0
idx_to = gares_list.index(default_to) if default_to in gares_list else 1 if len(gares_list) > 1 else 0

from_choice = st.selectbox("Choisir la gare de départ (ex. Nantes)", gares_list, index=idx_from)
to_choice = st.selectbox("Choisir la gare d'arrivée (ex. Paris Montparnasse 1 ou 2)", gares_list, index=idx_to)

api_key = '2d5f9bc9-9eb2-471b-bba8-24d542cf79ae'
token = base64.b64encode(f"{api_key}:".encode()).decode()
headers = {'Authorization': f'Basic {token}'}

if 'calcul_done' not in st.session_state:
    st.session_state.calcul_done = False

if st.button("Calculer"):
    st.session_state.calcul_done = True

if st.session_state.calcul_done:
    lignes = df_tarif[(df_tarif['Gare origine'] == from_choice) &
                      (df_tarif['Gare destination'] == to_choice)]
    
    tarif_disponible = True
    if lignes.empty:
        st.warning("Aucun tarif trouvé pour cette liaison.")
        tarif_disponible = False

    code_from = None
    code_to = None
    if tarif_disponible:
        code_from = lignes['Gare origine - code UIC'].values[0]
        code_to = lignes['Gare destination - code UIC'].values[0]
    else:
        code_from_serie = df_gares.loc[df_gares['LIBELLE'] == from_choice, 'CODE_UIC']
        code_to_serie = df_gares.loc[df_gares['LIBELLE'] == to_choice, 'CODE_UIC']
        if len(code_from_serie) == 0 or len(code_to_serie) == 0:
            st.error("Impossible de retrouver les codes UIC pour l'une des gares.")
            st.stop()
        code_from = int(code_from_serie.values[0])
        code_to = int(code_to_serie.values[0])

    legs = get_full_journey(code_from, code_to)
    if not legs:
        st.warning("Aucun trajet trouvé via l’API SNCF.")
    else:
        total_duration = sum(leg['duration'] for leg in legs if leg['duration'])
        hours = total_duration // 3600
        minutes = (total_duration % 3600) // 60
        st.success(f"Durée totale : {hours}h{minutes}mn")

        st.markdown("### Étapes du trajet :")
        for i, leg in enumerate(legs):
            dep = leg['from_name']
            arr = leg['to_name']
            dep_time = leg['departure_time']
            arr_time = leg['arrival_time']
            dur_sec = leg['duration']
            h = dur_sec // 3600 if dur_sec else 0
            m = (dur_sec % 3600) // 60 if dur_sec else 0
            st.write(f"Étape {i+1}: {dep} → {arr} | départ: {dep_time} arrivée: {arr_time} | durée {h}h{m}mn")

        if tarif_disponible:
            prix_min = lignes['Prix minimum'].mean()
            prix_max = lignes['Prix maximum'].mean()
            prix_moyen = (prix_min + prix_max) / 2
            st.info(f"Prix moyen estimé (liaison complète) : {prix_moyen:.2f} €")
        else:
            st.info("Pas de tarif disponible pour cette liaison.")

        co2_ligne = df_co2[(df_co2['Origine_uic'] == int(code_from)) & (df_co2['Destination_uic'] == int(code_to))]
        distance = None
        if not co2_ligne.empty:
            distance = co2_ligne["Distance entre les gares"].values[0]
            st.info(f"Distance (trajet SNCF) : {distance:.1f} km")
            train_co2 = co2_ligne["Train - Empreinte carbone (kgCO2e)"].values[0]
            car_co2 = co2_ligne["Voiture thermique (2,2 pers.) - Empreinte carbone (kgCO2e)"].values[0]
            if not pd.isnull(train_co2):
                st.info(f"CO₂ Train : {train_co2:.2f} kg")
            else:
                st.info(f"CO₂ Train estimé : {estime_co2_train(distance):.2f} kg")
            if not pd.isnull(car_co2):
                st.info(f"CO₂ Voiture : {car_co2:.2f} kg")
            else:
                st.info(f"CO₂ Voiture estimé : {estime_co2_voiture(distance):.2f} kg")
        else:
            lat1, lon1 = get_coords(df_gares, code_from)
            lat2, lon2 = get_coords(df_gares, code_to)
            if None not in (lat1, lon1, lat2, lon2):
                distance = distance_haversine(lat1, lon1, lat2, lon2)
                st.info(f"Distance estimée à vol d'oiseau : {distance:.1f} km")
                st.info(f"CO₂ Train estimé : {estime_co2_train(distance):.2f} kg")
                st.info(f"CO₂ Voiture estimé : {estime_co2_voiture(distance):.2f} kg")

        # Carte simple 2 points et tracé droit bleu
        lat1, lon1 = get_coords(df_gares, code_from)
        lat2, lon2 = get_coords(df_gares, code_to)
        if None not in (lat1, lon1, lat2, lon2):
            m = folium.Map(location=[(lat1 + lat2) / 2, (lon1 + lon2) / 2], zoom_start=6)
            folium.Marker([lat1, lon1], popup=from_choice, icon=folium.Icon(color='blue')).add_to(m)
            folium.Marker([lat2, lon2], popup=to_choice, icon=folium.Icon(color='red')).add_to(m)
            folium.PolyLine([[lat1, lon1], [lat2, lon2]], color="blue", weight=5, opacity=0.7).add_to(m)
            st.markdown("### Carte du trajet simple")
            st_folium(m, width=700, height=500)
        else:
            st.warning("Coordonnées GPS manquantes, impossible d'afficher la carte.")
else:
    st.info("Veuillez saisir les gares et cliquer sur Calculer.")
