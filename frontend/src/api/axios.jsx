import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL ?? "";
console.log("🌍 API Base URL =", baseURL);
const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    const { exp } = JSON.parse(atob(token.split(".")[1]));
                    if (exp * 1000 < Date.now()) {
                        localStorage.removeItem("token");
                        window.dispatchEvent(new Event("auth:expired"));
                    }
                } catch {}
            }
        }
        return Promise.reject(error);
    }
);

export default api;
