import { useEffect, useState } from "react";

const WMO_CODES = {
    0: { label: "Ensoleillé", icon: "☀️" },
    1: { label: "Peu nuageux", icon: "🌤️" },
    2: { label: "Nuageux", icon: "⛅" },
    3: { label: "Couvert", icon: "☁️" },
    45: { label: "Brouillard", icon: "🌫️" },
    48: { label: "Brouillard givrant", icon: "🌫️" },
    51: { label: "Bruine légère", icon: "🌦️" },
    61: { label: "Pluie légère", icon: "🌧️" },
    63: { label: "Pluie modérée", icon: "🌧️" },
    65: { label: "Pluie forte", icon: "🌧️" },
    71: { label: "Neige légère", icon: "🌨️" },
    80: { label: "Averses", icon: "🌦️" },
    95: { label: "Orage", icon: "⛈️" },
};

function getWeatherInfo(code) {
    return WMO_CODES[code] || { label: "Variable", icon: "🌡️" };
}

export default function WeatherWidget({ lat, lon, cityName, travelDate }) {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!lat || !lon) return;
        const fetchWeather = async () => {
            try {
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Europe%2FParis&forecast_days=7`;
                const res = await fetch(url);
                const data = await res.json();

                const dates = data.daily?.time || [];
                const maxTemps = data.daily?.temperature_2m_max || [];
                const minTemps = data.daily?.temperature_2m_min || [];
                const codes = data.daily?.weathercode || [];

                // Trouver le jour correspondant à la date de voyage (ou J+1 si non trouvé)
                let idx = travelDate ? dates.indexOf(travelDate) : 0;
                if (idx < 0) idx = 0;

                setWeather({
                    date: dates[idx],
                    max: Math.round(maxTemps[idx]),
                    min: Math.round(minTemps[idx]),
                    ...getWeatherInfo(codes[idx]),
                });
            } catch {
                setWeather(null);
            } finally {
                setLoading(false);
            }
        };
        fetchWeather();
    }, [lat, lon, travelDate]);

    if (loading) return <div className="weather-widget weather-loading">Météo...</div>;
    if (!weather) return null;

    return (
        <div className="weather-widget">
            <div className="weather-icon">{weather.icon}</div>
            <div className="weather-info">
                <p className="weather-city">Météo à {cityName}</p>
                <p className="weather-label">{weather.label}</p>
                <p className="weather-temp">
                    <span className="temp-max">{weather.max}°</span>
                    <span className="temp-min"> / {weather.min}°</span>
                </p>
            </div>
        </div>
    );
}
