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
import { RequestQuote, Payment, Visibility } from "@mui/icons-material";
import apiClient from "../api/client";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import AbonoClienteFormModal from "../components/AbonoClienteFormModal";

const CuentasPorCobrarPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<"pendientes" | "historial">(
    "pendientes"
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState<any | null>(null);

  const loadCuentas = useCallback(() => {
    setLoading(true);
    apiClient
      .get("/cuentas-por-cobrar", { params: { tipo: currentTab } })
      .then((response) => setCuentas(response.data.data || []))
      .catch(() =>
        enqueueSnackbar("Error al cargar las cuentas por cobrar.", {
          variant: "error",
        })
      )
      .finally(() => setLoading(false));
  }, [enqueueSnackbar, currentTab]);

  useEffect(() => {
    loadCuentas();
  }, [loadCuentas]);

  const handleOpenModal = (cuenta: any) => {
    setSelectedCuenta(cuenta);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCuenta(null);
  };

  // --- FIX: Added "info" to the return type of the function ---
  const getStatusChipColor = (
    estado: string
  ): "success" | "warning" | "default" | "error" | "info" => {
    switch (estado) {
      case "pagada":
        return "success";
      case "pendiente":
        return "warning";
      case "abonada":
        return "info"; // This was causing the error because "info" was not allowed by the type definition
      case "anulada":
        return "default";
      case "vencida":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box p={3}>
      <Typography
        variant="h4"
        sx={{ mb: 2, display: "flex", alignItems: "center" }}
      >
        <RequestQuote sx={{ mr: 1 }} />
        Cuentas por Cobrar
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
            ? "No hay cuentas por cobrar pendientes."
            : "No hay registros en el historial."}
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Fecha Emisión</TableCell>
                <TableCell align="right">Monto Original</TableCell>
                <TableCell align="right">Monto Pendiente</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cuentas.map((cuenta) => (
                <TableRow key={cuenta.id} hover>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    {cuenta.cliente_nombre}
                  </TableCell>
                  <TableCell>
                    {new Date(cuenta.fecha_emision).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    ${Number(cuenta.monto_original).toFixed(2)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: "error.main", fontWeight: "bold" }}
                  >
                    ${Number(cuenta.monto_pendiente).toFixed(2)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={cuenta.estado}
                      color={getStatusChipColor(cuenta.estado)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver Venta Original">
                      <IconButton
                        onClick={() =>
                          navigate(`/ventas/detalle/${cuenta.venta_id}`)
                        }
                      >
                        <Visibility color="primary" />
                      </IconButton>
                    </Tooltip>
                    {currentTab === "pendientes" && (
                      <Tooltip title="Registrar Abono">
                        <IconButton onClick={() => handleOpenModal(cuenta)}>
                          <Payment color="success" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <AbonoClienteFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        cuenta={selectedCuenta}
        onSuccess={loadCuentas}
      />
    </Box>
  );
};

export default CuentasPorCobrarPage;
