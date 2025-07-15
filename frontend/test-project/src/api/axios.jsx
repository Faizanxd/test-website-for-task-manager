import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000", // 👈 Your Express server
  withCredentials: true, // ✅ Include cookies if needed
});

export default instance;
