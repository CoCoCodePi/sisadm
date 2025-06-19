import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import UserManagementPage from "../pages/UserManagementPage";
import ClientManagementPage from "../pages/ClientManagementPage";
import { CircularProgress, Box } from "@mui/material";
import ProveedoresPage from "../pages/ProveedoresPage";
import ProductsPage from "../pages/ProductsPage";
import ComprasPage from "../pages/ComprasPage";
import CompraFormPage from "../pages/CompraFormPage";
import CompraDetailPage from "../pages/CompraDetailPage";
import CuentasPorPagarPage from "../pages/CuentasPorPagarPage";
import CuentaPorPagarDetailPage from "../pages/CuentaPorPagarDetailPage";
import POSPage from "../pages/POSPage";
import TasaDelDiaPage from "../pages/TasaDelDiaPage";
import VentasPage from "../pages/VentasPage";
import VentaDetailPage from "../pages/VentaDetailPage";
import InventarioPage from "../pages/InventarioPage";
import ProveedorDetailPage from "../pages/ProveedorDetailPage";
import MetodosPagoPage from "../pages/MetodosPagoPage";
import CuentasPorCobrarPage from "../pages/CuentasPorCobrarPage";
import ReportesPage from "../pages/ReportesPage";
import ReporteVentasPage from "../pages/ReporteVentasPage";
import ReporteInventarioPage from "../pages/ReporteInventarioPage";
import ReporteMasVendidosPage from "../pages/ReporteMasVendidosPage";

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

  const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    if (isLoading) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress />
        </Box>
      );
    }
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
  };

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/pos"
          element={
            <PrivateRoute>
              <POSPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/ventas"
          element={
            <PrivateRoute>
              <VentasPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/ventas/detalle/:id"
          element={
            <PrivateRoute>
              <VentaDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/compras"
          element={
            <PrivateRoute>
              <ComprasPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/compras/nueva"
          element={
            <PrivateRoute>
              <CompraFormPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/compras/detalle/:id"
          element={
            <PrivateRoute>
              <CompraDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/inventario"
          element={
            <PrivateRoute>
              <InventarioPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/productos"
          element={
            <PrivateRoute>
              <ProductsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <PrivateRoute>
              <ClientManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/proveedores"
          element={
            <PrivateRoute>
              <ProveedoresPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/proveedores/detalle/:id"
          element={
            <PrivateRoute>
              <ProveedorDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/cuentas-por-pagar"
          element={
            <PrivateRoute>
              <CuentasPorPagarPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/cuentas-por-pagar/:id"
          element={
            <PrivateRoute>
              <CuentaPorPagarDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/cuentas-por-cobrar"
          element={
            <PrivateRoute>
              <CuentasPorCobrarPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <PrivateRoute>
              <UserManagementPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/reportes"
          element={
            <PrivateRoute>
              <ReportesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/reportes/ventas"
          element={
            <PrivateRoute>
              <ReporteVentasPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/reportes/inventario"
          element={
            <PrivateRoute>
              <ReporteInventarioPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/reportes/mas-vendidos"
          element={
            <PrivateRoute>
              <ReporteMasVendidosPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/configuracion/tasa-de-cambio"
          element={
            <PrivateRoute>
              <TasaDelDiaPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/configuracion/metodos-pago"
          element={
            <PrivateRoute>
              <MetodosPagoPage />
            </PrivateRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default AppRoutes;
