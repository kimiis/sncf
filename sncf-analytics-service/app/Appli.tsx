import React, { useState, useEffect } from 'react';
import { Train, MapPin, Clock, Euro, Leaf, Car, Plane, Hotel, Bike, MapPinned, Search, ArrowRight } from 'lucide-react';

const SNCFApp = () => {
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE = 'http://10.18.72.31:8000';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3">
            <Train size={36} />
            <div>
              <h1 className="text-3xl font-bold">SNCF Connect</h1>
              <p className="text-blue-100">Réservez vos billets de train</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Formulaire de recherche */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Rechercher un trajet</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Départ */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="inline mr-2" size={18} />
                Gare de départ
              </label>
              <input
                type="text"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Ex: Paris Gare de Lyon"
              />
              {fromSuggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                  {fromSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setFromCity(suggestion);
                        setFromSuggestions([]);
                      }}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
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
                <MapPinned className="inline mr-2" size={18} />
                Gare d'arrivée
              </label>
              <input
                type="text"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Ex: Marseille Saint-Charles"
              />
              {toSuggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                  {toSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setToCity(suggestion);
                        setToSuggestions([]);
                      }}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>Recherche en cours...</>
              ) : (
                <>
                  <Search size={20} />
                  Rechercher
                </>
              )}
            </button>
            <button
              onClick={swapCities}
              className="bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-all"
            >
              ⇄ Inverser
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Résultats */}
        {result && (
          <div className="space-y-6">
            {/* Carte du trajet */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPinned className="text-blue-600" />
                Carte du trajet
              </h3>
              <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                {result.coordonnees_depart?.latitude && result.coordonnees_arrivee?.latitude ? (
                  <iframe
                    title="Carte du trajet"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${result.coordonnees_depart.longitude - 0.5},${result.coordonnees_depart.latitude - 0.5},${result.coordonnees_arrivee.longitude + 0.5},${result.coordonnees_arrivee.latitude + 0.5}&layer=mapnik&marker=${result.coordonnees_depart.latitude},${result.coordonnees_depart.longitude}&marker=${result.coordonnees_arrivee.latitude},${result.coordonnees_arrivee.longitude}`}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Carte non disponible
                  </div>
                )}
              </div>
            </div>

            {/* Infos principales */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg p-6">
                <Clock className="mb-3" size={32} />
                <div className="text-sm opacity-90">Durée du trajet</div>
                <div className="text-3xl font-bold mt-2">
                  {result.duree || 'N/A'}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl shadow-lg p-6">
                <Euro className="mb-3" size={32} />
                <div className="text-sm opacity-90">Prix moyen</div>
                <div className="text-3xl font-bold mt-2">
                  {result.prix_moyen ? `${result.prix_moyen.toFixed(2)}€` : 'N/A'}
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl shadow-lg p-6">
                <MapPin className="mb-3" size={32} />
                <div className="text-sm opacity-90">Distance</div>
                <div className="text-3xl font-bold mt-2">
                  {result.distance_km ? `${result.distance_km} km` : 'N/A'}
                </div>
              </div>
            </div>

            {/* Comparaison CO2 */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Leaf className="text-green-600" />
                Impact environnemental
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Train className="text-green-600" size={24} />
                    <span className="font-semibold text-gray-800">Train</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {result.co2_train_kg ? `${result.co2_train_kg.toFixed(2)} kg` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">CO₂ émis</div>
                </div>

                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="text-orange-600" size={24} />
                    <span className="font-semibold text-gray-800">Voiture</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {result.co2_voiture_kg ? `${result.co2_voiture_kg.toFixed(2)} kg` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">CO₂ émis</div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Leaf className="text-blue-600" size={24} />
                    <span className="font-semibold text-gray-800">Économie</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {result.co2_train_kg && result.co2_voiture_kg 
                      ? `${((result.co2_voiture_kg - result.co2_train_kg) / result.co2_voiture_kg * 100).toFixed(0)}%`
                      : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">vs voiture</div>
                </div>
              </div>
            </div>

            {/* Services à proximité */}
            {(result.hotels_proches?.length > 0 || result.stations_velo_proches?.length > 0 || result.activites_proches?.length > 0) && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Services à proximité de {result.to_city}
                </h3>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Hôtels */}
                  {result.hotels_proches?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Hotel className="text-purple-600" size={20} />
                        Hôtels proches ({result.hotels_proches.length})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {result.hotels_proches.slice(0, 5).map((hotel, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg text-sm">
                            <div className="font-medium text-gray-800">{hotel.name || 'Hôtel'}</div>
                            <div className="text-gray-600 text-xs mt-1">
                              📍 {hotel.distance_km_from_station} km de la gare
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vélos */}
                  {result.stations_velo_proches?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Bike className="text-blue-600" size={20} />
                        Stations vélo ({result.stations_velo_proches.length})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {result.stations_velo_proches.slice(0, 5).map((station, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg text-sm">
                            <div className="font-medium text-gray-800">
                              {station.name || station.type === 'bicycle_rental' ? 'Location vélo' : 'Parking vélo'}
                            </div>
                            <div className="text-gray-600 text-xs mt-1">
                              📍 {station.distance_km_from_station} km de la gare
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activités */}
                  {result.activites_proches?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <MapPinned className="text-orange-600" size={20} />
                        Activités ({result.activites_proches.length})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {result.activites_proches.slice(0, 5).map((activity, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg text-sm">
                            <div className="font-medium text-gray-800">{activity.name || activity.category}</div>
                            <div className="text-gray-600 text-xs mt-1">
                              📍 {activity.distance_km_from_station} km • {activity.category}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SNCFApp;