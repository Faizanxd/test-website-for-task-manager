// src/api/axios.js
import axios from "axios";

// Base URL from Vite environment variables
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  withCredentials: true,
});

export default instance;
