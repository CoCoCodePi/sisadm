import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const usePersistedLocation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth(); // Añadir isLoading

  useEffect(() => {
    if (!isLoading) {
      // Solo ejecutar después de verificar autenticación
      localStorage.setItem("lastPath", location.pathname);
    }
  }, [location, isLoading]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Esperar a que termine la carga
      const lastPath = localStorage.getItem("lastPath");
      if (lastPath && lastPath !== location.pathname) {
        navigate(lastPath);
      }
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]);
};

export default usePersistedLocation;
