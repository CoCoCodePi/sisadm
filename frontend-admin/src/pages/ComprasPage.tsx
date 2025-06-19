import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  Pagination,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Add,
  ShoppingCart,
  Visibility,
  Cancel,
  Payment,
} from "@mui/icons-material"; // Ícono 'Payment' añadido
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { useSnackbar } from "notistack";
import PagoProveedorFormModal from "../components/PagoProveedorFormModal";
import ConfirmationDialog from "../components/ConfirmationDialog";

interface Compra {
  id: number;
  codigo_orden: string;
  fecha_orden: string;
  total: number;
  moneda: "USD" | "VES";
  estado: "recibida" | "cancelada" | "pagada";
  proveedor_nombre: string;
  cuenta_por_pagar_id: number;
  monto_pendiente: number;
  monto_original: number;
  estado_pago: "pendiente" | "vencida" | "abonada" | "pagada" | "anulada";
}

const ComprasPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const [pagoModalOpen, setPagoModalOpen] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState<{
    id: number;
    monto_pendiente: number;
    proveedor_nombre: string;
  } | null>(null);

  const [anularDialogOpen, setAnularDialogOpen] = useState(false);
  const [compraToAnular, setCompraToAnular] = useState<number | null>(null);

  const loadCompras = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const response = await apiClient.get("/compras", {
          params: { page, limit: pagination.limit },
        });
        if (response.data.success) {
          setCompras(response.data.data || []);
          setPagination((prev) => ({
            ...prev,
            total: response.data.total || 0,
          }));
        }
      } catch (error) {
        console.error("Error cargando compras:", error);
        enqueueSnackbar("Error al cargar la lista de compras.", {
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, enqueueSnackbar]
  );

  useEffect(() => {
    loadCompras(pagination.page);
  }, [pagination.page, loadCompras]);

  const handleOpenPagoModal = (compra: Compra) => {
    if (compra.monto_pendiente <= 0) {
      enqueueSnackbar("Esta compra ya ha sido saldada.", { variant: "info" });
      return;
    }
    setSelectedCuenta({
      id: compra.cuenta_por_pagar_id,
      monto_pendiente: compra.monto_pendiente,
      proveedor_nombre: compra.proveedor_nombre,
    });
    setPagoModalOpen(true);
  };

  const handleAnularClick = (compraId: number) => {
    setCompraToAnular(compraId);
    setAnularDialogOpen(true);
  };

  const handleConfirmAnular = async () => {
    if (!compraToAnular) return;
    try {
      await apiClient.put(`/compras/${compraToAnular}/anular`);
      enqueueSnackbar("Compra anulada con éxito.", { variant: "success" });
      loadCompras(pagination.page);
    } catch (error: any) {
      enqueueSnackbar(
        error.response?.data?.message || "Error al anular la compra",
        { variant: "error" }
      );
    } finally {
      setAnularDialogOpen(false);
      setCompraToAnular(null);
    }
  };

  const getStatusChipColor = (estado: Compra["estado_pago"]) => {
    switch (estado) {
      case "pagada":
        return "success";
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
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        gap={2}
      >
        <Typography variant="h4" sx={{ display: "flex", alignItems: "center" }}>
          <ShoppingCart sx={{ mr: 1 }} />
          Gestión de Compras
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate("/compras/nueva")}
        >
          Registrar Nueva Compra
        </Button>
      </Stack>

      {loading && compras.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
          <CircularProgress />
        </Box>
      ) : !loading && compras.length === 0 ? (
        <Alert severity="info">No se han registrado compras todavía.</Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Proveedor</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Total Compra</TableCell>
                  <TableCell>Pendiente (USD)</TableCell>
                  <TableCell>Estado de Pago</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {compras.map((compra) => {
                  const isAnulable =
                    compra.monto_pendiente >= compra.monto_original;
                  const isPagadaOAnulada =
                    compra.estado_pago === "pagada" ||
                    compra.estado_pago === "anulada";
                  return (
                    <TableRow
                      key={compra.id}
                      hover
                      sx={{ opacity: isPagadaOAnulada ? 0.6 : 1 }}
                    >
                      <TableCell sx={{ fontWeight: "bold" }}>
                        {compra.codigo_orden}
                      </TableCell>
                      <TableCell>{compra.proveedor_nombre}</TableCell>
                      <TableCell>
                        {new Date(compra.fecha_orden).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {compra.total.toFixed(2)}{" "}
                        <Chip label={compra.moneda} size="small" />
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: "bold", color: "error.main" }}
                      >
                        ${compra.monto_pendiente.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={compra.estado_pago}
                          color={getStatusChipColor(compra.estado_pago)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Ver Detalles">
                          <IconButton
                            onClick={() =>
                              navigate(`/compras/detalle/${compra.id}`)
                            }
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Registrar Pago">
                          <span>
                            <IconButton
                              onClick={() => handleOpenPagoModal(compra)}
                              color="success"
                              disabled={isPagadaOAnulada}
                            >
                              <Payment />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title={
                            !isAnulable
                              ? "No se puede anular una compra con pagos registrados"
                              : "Anular Compra"
                          }
                        >
                          <span>
                            <IconButton
                              onClick={() => handleAnularClick(compra.id)}
                              color="error"
                              disabled={!isAnulable || isPagadaOAnulada}
                            >
                              <Cancel />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box display="flex" justifyContent="center" mt={2}>
            <Pagination
              count={Math.ceil(pagination.total / pagination.limit)}
              page={pagination.page}
              onChange={(_, page) =>
                setPagination((prev) => ({ ...prev, page }))
              }
              color="primary"
            />
          </Box>
        </>
      )}

      {selectedCuenta && (
        <PagoProveedorFormModal
          open={pagoModalOpen}
          onClose={() => setPagoModalOpen(false)}
          cuenta={selectedCuenta}
          onSuccess={() => loadCompras(pagination.page)}
        />
      )}

      <ConfirmationDialog
        open={anularDialogOpen}
        title="Confirmar Anulación"
        content="¿Está seguro de anular esta compra? Esta acción cambiará su estado a 'cancelada' y el de su cuenta por pagar a 'anulada'. Esta acción no se puede deshacer y no revierte el inventario."
        onClose={() => setAnularDialogOpen(false)}
        onConfirm={handleConfirmAnular}
        confirmText="Anular"
        confirmColor="error"
      />
    </Box>
  );
};

export default ComprasPage;
