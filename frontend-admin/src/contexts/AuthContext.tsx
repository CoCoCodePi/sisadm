import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/client";
import { useNavigate } from "react-router-dom";

export type User = {
  id: string;
  email: string;
  nombre: string;
  rol: "maestro" | "admin" | "vendedor"; // Mantener consistencia con backend
  password?: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (userData: RegisterData) => Promise<void>;
  updateUser: (email: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (email: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean; // Nuevo valor en el contexto
};

type RegisterData = {
  email: string;
  password: string;
  nombre: string;
  rol: "maestro" | "admin" | "vendedor";
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Nuevo estado de carga
  const navigate = useNavigate();

  const verifyToken = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const { data } = await apiClient.get("/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.valid && data.user) {
        const userData = decodeJWT(token);
        setUser(userData);
      }
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Interceptor para manejar respuestas no autorizadas
  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    verifyToken();

    return () => {
      apiClient.interceptors.response.eject(interceptor);
    };
  }, []);

  // Decodificar JWT
  const decodeJWT = (token: string): User | null => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));

      return {
        id: payload.sub,
        email: payload.email,
        nombre: payload.nombre,
        rol: payload.rol,
      };
    } catch (error) {
      console.error("Error decodificando JWT:", error);
      return null;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data } = await apiClient.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);

      const userData = decodeJWT(data.token);
      if (userData) {
        setUser(userData);
        navigate("/dashboard");
      }
    } catch (error) {
      localStorage.removeItem("token");
      throw new Error("Credenciales inválidas");
    }
  };

  const registerUser = async (userData: RegisterData) => {
    await apiClient.post("/auth/register", userData, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
  };

  const updateUser = async (email: string, userData: Partial<User>) => {
    const { data } = await apiClient.put(
      "/auth/update",
      { email, ...userData },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );

    // Actualizar datos del usuario actual si es el mismo
    if (user?.email === email) {
      setUser((prev) => (prev ? { ...prev, ...userData } : null));
    }

    return data;
  };

  const deleteUser = async (email: string) => {
    await apiClient.delete("/auth/delete", {
      data: { email },
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        registerUser,
        updateUser,
        deleteUser,
        logout,
        isAuthenticated: !!user && !loading, // Modificado
        isLoading: loading, // Nuevo valor en el contexto
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
