import axios from 'axios';


// this is the connection to the backend API
const api = axios.create({
    baseURL: "http://localhost:8000/api",
});


// this automatically adds the JWT token to requests (later)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }       
    return config;
});

export default api;