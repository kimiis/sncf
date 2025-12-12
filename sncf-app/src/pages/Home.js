import React, { useState, useEffect } from 'react';
import { Train, MapPin, Clock, Euro, Leaf, Car, Hotel, Bike, MapPinned, Search, LogOut, LogIn } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix pour les icônes Leaflet dans React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const Home = () => {
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est connecté
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userEmail = localStorage.getItem('userEmail');

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    window.location.reload();
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const fetchSuggestions = async (query, setSuggestions) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/autocomplete?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      console.error('Erreur autocomplétion:', err);
      setSuggestions([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(fromCity, setFromSuggestions);
    }, 300);
    return () => clearTimeout(timer);
  }, [fromCity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(toCity, setToSuggestions);
    }, 300);
    return () => clearTimeout(timer);
  }, [toCity]);

  const handleSearch = async () => {
    if (!fromCity || !toCity) {
      setError('Veuillez renseigner les deux gares');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `${API_BASE}/trajet?from_city=${encodeURIComponent(fromCity)}&to_city=${encodeURIComponent(toCity)}`
      );
      
      if (!response.ok) {
        throw new Error('Erreur lors de la recherche');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Impossible de récupérer les données. Vérifiez votre connexion.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const swapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec les couleurs SNCF officielles */}
      <div className="bg-[#812B6D] text-white py-4 shadow-lg">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-lg p-2">
              <Train size={32} className="text-[#812B6D]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">SNCF Connect</h1>
              <p className="text-sm text-white/90">Recherchez et réservez vos billets de train</p>
            </div>
          </div>
          
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-sm hidden md:block">{userEmail}</span>
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-semibold"
              >
                <LogOut size={18} />
                Déconnexion
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-white text-[#812B6D] hover:bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-semibold"
            >
              <LogIn size={18} />
              Se connecter
            </button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Message pour les utilisateurs non connectés */}
        {!isAuthenticated && (
          <div className="bg-white border-l-4 border-[#E94E1B] rounded-lg p-4 mb-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#E94E1B] text-white p-2 rounded-lg">
                <LogIn size={20} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Accès limité</p>
                <p className="text-xs text-gray-600">Connectez-vous pour accéder aux informations CO₂ et services à proximité</p>
              </div>
            </div>
            <button
              onClick={handleLogin}
              className="bg-[#812B6D] hover:bg-[#6d2460] text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
            >
              Se connecter
            </button>
          </div>
        )}

        {/* Formulaire de recherche */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Search className="text-[#812B6D]" size={24} />
            Rechercher un trajet
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-5">
            {/* Départ */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="inline mr-1" size={16} />
                Gare de départ
              </label>
              <input
                type="text"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                onFocus={() => {
                  if (fromCity.length >= 2) {
                    fetchSuggestions(fromCity, setFromSuggestions);
                  }
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#812B6D] focus:outline-none text-sm"
                placeholder="Ex: Paris Gare de Lyon"
              />
              {fromSuggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-xl max-h-60 overflow-y-auto">
                  {fromSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setFromCity(suggestion);
                        setFromSuggestions([]);
                      }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 text-sm"
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Arrivée */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPinned className="inline mr-1" size={16} />
                Gare d'arrivée
              </label>
              <input
                type="text"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                onFocus={() => {
                  if (toCity.length >= 2) {
                    fetchSuggestions(toCity, setToSuggestions);
                  }
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#812B6D] focus:outline-none text-sm"
                placeholder="Ex: Marseille Saint-Charles"
              />
              {toSuggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-xl max-h-60 overflow-y-auto">
                  {toSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setToCity(suggestion);
                        setToSuggestions([]);
                      }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 text-sm"
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex-1 bg-[#E94E1B] hover:bg-[#d4451a] text-white py-3 px-6 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-md"
            >
              {loading ? (
                <>Recherche en cours...</>
              ) : (
                <>
                  <Search size={18} />
                  Rechercher
                </>
              )}
            </button>
            <button
              onClick={swapCities}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-5 rounded-lg font-semibold transition-all text-sm"
            >
              ⇄
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Résultats */}
        {result && (
          <div className="space-y-6">
            {/* Infos principales */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-[#812B6D]">
                <Clock className="mb-2 text-[#812B6D]" size={28} />
                <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Durée</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {result.duree || 'N/A'}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-[#E94E1B]">
                <Euro className="mb-2 text-[#E94E1B]" size={28} />
                <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Prix moyen</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {result.prix_moyen ? `${result.prix_moyen.toFixed(2)}€` : 'N/A'}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-[#82BE00]">
                <MapPin className="mb-2 text-[#82BE00]" size={28} />
                <div className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Distance</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {result.distance_km ? `${result.distance_km} km` : 'N/A'}
                </div>
              </div>
            </div>

            {/* Carte du trajet */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPinned className="text-[#812B6D]" size={22} />
                Itinéraire
              </h3>
              <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                {result.coordonnees_depart?.latitude && result.coordonnees_arrivee?.latitude ? (
                  <MapContainer
                    center={[
                      (result.coordonnees_depart.latitude + result.coordonnees_arrivee.latitude) / 2,
                      (result.coordonnees_depart.longitude + result.coordonnees_arrivee.longitude) / 2
                    ]}
                    zoom={6}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    <Marker position={[result.coordonnees_depart.latitude, result.coordonnees_depart.longitude]}>
                      <Popup>
                        <strong>{result.from_city}</strong><br/>
                        Départ
                      </Popup>
                    </Marker>
                    
                    <Marker position={[result.coordonnees_arrivee.latitude, result.coordonnees_arrivee.longitude]}>
                      <Popup>
                        <strong>{result.to_city}</strong><br/>
                        Arrivée
                      </Popup>
                    </Marker>
                    
                    <Polyline
                      positions={[
                        [result.coordonnees_depart.latitude, result.coordonnees_depart.longitude],
                        [result.coordonnees_arrivee.latitude, result.coordonnees_arrivee.longitude]
                      ]}
                      color="#812B6D"
                      weight={4}
                      opacity={0.8}
                    />
                  </MapContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Carte non disponible
                  </div>
                )}
              </div>
            </div>

            {/* Impact CO₂ - RÉSERVÉ AUX CONNECTÉS */}
            {isAuthenticated ? (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Leaf className="text-[#82BE00]" size={22} />
                  Empreinte carbone
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-green-50 border-2 border-[#82BE00] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Train className="text-[#82BE00]" size={22} />
                      <span className="font-bold text-gray-900 text-sm">Train</span>
                    </div>
                    <div className="text-2xl font-bold text-[#82BE00]">
                      {result.co2_train_kg ? `${result.co2_train_kg.toFixed(1)} kg` : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">de CO₂</div>
                  </div>

                  <div className="bg-orange-50 border-2 border-[#E94E1B] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="text-[#E94E1B]" size={22} />
                      <span className="font-bold text-gray-900 text-sm">Voiture</span>
                    </div>
                    <div className="text-2xl font-bold text-[#E94E1B]">
                      {result.co2_voiture_kg ? `${result.co2_voiture_kg.toFixed(1)} kg` : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">de CO₂</div>
                  </div>

                  <div className="bg-blue-50 border-2 border-[#812B6D] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Leaf className="text-[#812B6D]" size={22} />
                      <span className="font-bold text-gray-900 text-sm">Économie</span>
                    </div>
                    <div className="text-2xl font-bold text-[#812B6D]">
                      {result.co2_train_kg && result.co2_voiture_kg 
                        ? `-${((result.co2_voiture_kg - result.co2_train_kg) / result.co2_voiture_kg * 100).toFixed(0)}%`
                        : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">vs voiture</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-8 text-center">
                <div className="bg-[#82BE00] text-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Leaf size={28} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Empreinte carbone</h3>
                <p className="text-gray-600 text-sm mb-4">Comparez l'impact environnemental du train vs la voiture</p>
                <button
                  onClick={handleLogin}
                  className="bg-[#812B6D] hover:bg-[#6d2460] text-white px-6 py-2 rounded-lg font-semibold transition-all text-sm"
                >
                  Se connecter
                </button>
              </div>
            )}

            {/* Services à proximité - RÉSERVÉ AUX CONNECTÉS */}
            {isAuthenticated ? (
              (result.hotels_proches?.length > 0 || result.stations_velo_proches?.length > 0 || result.activites_proches?.length > 0) && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Services à proximité de {result.to_city}
                  </h3>

                  <div className="grid md:grid-cols-3 gap-6">
                    {result.hotels_proches?.length > 0 && (
                      <div>
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                          <Hotel className="text-[#812B6D]" size={18} />
                          Hôtels ({result.hotels_proches.length})
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {result.hotels_proches.slice(0, 5).map((hotel, idx) => (
                            <div key={idx} className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                              <div className="font-semibold text-gray-900 text-sm">{hotel.name || 'Hôtel'}</div>
                              <div className="text-gray-600 text-xs mt-1">
                                📍 {hotel.distance_km_from_station} km
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.stations_velo_proches?.length > 0 && (
                      <div>
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                          <Bike className="text-[#E94E1B]" size={18} />
                          Vélos ({result.stations_velo_proches.length})
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {result.stations_velo_proches.slice(0, 5).map((station, idx) => (
                            <div key={idx} className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                              <div className="font-semibold text-gray-900 text-sm">
                                {station.name || (station.type === 'bicycle_rental' ? 'Location vélo' : 'Parking vélo')}
                              </div>
                              <div className="text-gray-600 text-xs mt-1">
                                📍 {station.distance_km_from_station} km
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.activites_proches?.length > 0 && (
                      <div>
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                          <MapPinned className="text-[#82BE00]" size={18} />
                          Activités ({result.activites_proches.length})
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {result.activites_proches.slice(0, 5).map((activity, idx) => (
                            <div key={idx} className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                              <div className="font-semibold text-gray-900 text-sm">{activity.name || activity.category}</div>
                              <div className="text-gray-600 text-xs mt-1">
                                📍 {activity.distance_km_from_station} km
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-8 text-center">
                <div className="flex justify-center gap-3 mb-3">
                  <div className="bg-[#812B6D] text-white w-12 h-12 rounded-full flex items-center justify-center">
                    <Hotel size={24} />
                  </div>
                  <div className="bg-[#E94E1B] text-white w-12 h-12 rounded-full flex items-center justify-center">
                    <Bike size={24} />
                  </div>
                  <div className="bg-[#82BE00] text-white w-12 h-12 rounded-full flex items-center justify-center">
                    <MapPinned size={24} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Services à proximité</h3>
                <p className="text-gray-600 text-sm mb-4">Hôtels, vélos et activités près de votre destination</p>
                <button
                  onClick={handleLogin}
                  className="bg-[#812B6D] hover:bg-[#6d2460] text-white px-6 py-2 rounded-lg font-semibold transition-all text-sm"
                >
                  Se connecter
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
