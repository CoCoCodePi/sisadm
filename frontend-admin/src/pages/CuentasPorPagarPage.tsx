import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
} from "@mui/material";
import { AttachMoney, Payment, Visibility } from "@mui/icons-material";
import apiClient from "../api/client";
import { useSnackbar } from "notistack";
import PagoProveedorFormModal from "../components/PagoProveedorFormModal";
import { useNavigate } from "react-router-dom";

const CuentasPorPagarPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<"pendientes" | "historial">(
    "pendientes"
  );
  const [pagoModalOpen, setPagoModalOpen] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState<any | null>(null);

  const loadCuentas = useCallback(() => {
    setLoading(true);
    apiClient
      .get("/cuentas-por-pagar", { params: { tipo: currentTab } })
      .then((response) => setCuentas(response.data.data || []))
      .catch(() =>
        enqueueSnackbar("Error al cargar las cuentas por pagar.", {
          variant: "error",
        })
      )
      .finally(() => setLoading(false));
  }, [enqueueSnackbar, currentTab]);

  useEffect(() => {
    loadCuentas();
  }, [loadCuentas]);

  const handleOpenPagoModal = (cuenta: any) => {
    setSelectedCuenta(cuenta);
    setPagoModalOpen(true);
  };

  const getStatusChipColor = (estado: string) => {
    switch (estado) {
      case "pagada":
        return "success";
      case "anulada":
        return "default";
      case "vencida":
        return "error";
      case "abonada":
        return "info";
      case "pendiente":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        sx={{ mb: 2, display: "flex", alignItems: "center" }}
      >
        <AttachMoney sx={{ mr: 1 }} />
        Cuentas por Pagar
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
        >
          <Tab label="Pendientes" value="pendientes" />
          <Tab label="Historial" value="historial" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
          <CircularProgress />
        </Box>
      ) : cuentas.length === 0 ? (
        <Alert severity="info">
          {currentTab === "pendientes"
            ? "¡Felicidades! No tienes cuentas pendientes por pagar."
            : "No hay registros en el historial."}
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Proveedor</TableCell>
                <TableCell>Orden Compra</TableCell>
                <TableCell align="right">Monto Original</TableCell>
                <TableCell align="right">Monto Pendiente</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cuentas.map((cuenta) => (
                <TableRow key={cuenta.id} hover>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    {cuenta.proveedor_nombre}
                  </TableCell>
                  <TableCell>{cuenta.codigo_orden}</TableCell>
                  <TableCell align="right">
                    ${Number(cuenta.monto_original).toFixed(2)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: "bold",
                      color:
                        cuenta.monto_pendiente > 0 ? "error.main" : "inherit",
                    }}
                  >
                    ${Number(cuenta.monto_pendiente).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {new Date(cuenta.fecha_vencimiento).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cuenta.estado}
                      color={getStatusChipColor(cuenta.estado)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver Detalles Compra">
                      <IconButton
                        onClick={() =>
                          navigate(`/compras/detalle/${cuenta.compra_id}`)
                        }
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    {currentTab === "pendientes" && (
                      <Tooltip title="Registrar Pago">
                        <span>
                          <IconButton
                            onClick={() => handleOpenPagoModal(cuenta)}
                            color="success"
                          >
                            <Payment />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {selectedCuenta && (
        <PagoProveedorFormModal
          open={pagoModalOpen}
          onClose={() => setPagoModalOpen(false)}
          cuenta={selectedCuenta}
          onSuccess={loadCuentas}
        />
      )}
    </Box>
  );
};

export default CuentasPorPagarPage;
