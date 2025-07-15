// src/context/AuthProvider.jsx
import { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  let storedUser = null;
  try {
    storedUser = JSON.parse(localStorage.getItem("user"));
  } catch (err) {
    console.warn("Invalid user in localStorage");
    localStorage.removeItem("user");
  }

  const [user, setUser] = useState(storedUser || null);

  const login = (userObj) => {
    setUser(userObj);
    localStorage.setItem("user", JSON.stringify(userObj));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
