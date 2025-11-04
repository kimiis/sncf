import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL ?? "";

const api = axios.create({ baseURL });

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default api;
