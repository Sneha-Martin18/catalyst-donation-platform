import { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "../api/api";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchInProgress = useRef(false);

    const refreshUser = async () => {
        try {
            const res = await api.get("users/profile/");
            setUser(res.data);
            setError(null);
            return res.data;
        } catch (err) {
            console.error("Failed to fetch user profile:", err);
            setError(err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("access");
        if (token && !fetchInProgress.current) {
            fetchInProgress.current = true;
            refreshUser().finally(() => {
                fetchInProgress.current = false;
            });
        } else if (!token) {
            setLoading(false);
        }
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, loading, error, refreshUser, isVerified: user?.is_verified }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
