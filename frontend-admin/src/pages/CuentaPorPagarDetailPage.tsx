// Contenido 100% Completo para el NUEVO archivo: frontend/src/pages/CuentaPorPagarDetailPage.tsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import apiClient from "../api/client";
import { useSnackbar } from "notistack";

interface PagoDetalle {
  metodo: string;
  monto: number;
  moneda: "USD" | "VES";
  referencia: string;
}

interface Pago {
  id: number;
  fecha_pago: string;
  monto_total_pagado: number;
  observacion: string;
  detalles: PagoDetalle[];
}

interface CuentaDetalle {
  id: number;
  codigo_orden: string;
  proveedor_nombre: string;
  monto_original: number;
  monto_pendiente: number;
  fecha_vencimiento: string;
  estado: string;
  pagos: Pago[];
}

const CuentaPorPagarDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [cuenta, setCuenta] = useState<CuentaDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient
      .get(`/cuentas-por-pagar/${id}`)
      .then((response) => {
        if (response.data.success) {
          setCuenta(response.data.data);
        }
      })
      .catch((error) => {
        console.error("Error cargando detalle de la cuenta:", error);
        enqueueSnackbar("Error al cargar el detalle de la cuenta.", {
          variant: "error",
        });
      })
      .finally(() => setLoading(false));
  }, [id, enqueueSnackbar]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!cuenta) {
    return <Typography>Cuenta por Pagar no encontrada.</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate("/cuentas-por-pagar")}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ ml: 2 }}>
          Detalle de Cuenta por Pagar
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Proveedor
            </Typography>
            <Typography variant="body1">{cuenta.proveedor_nombre}</Typography>
            <Typography variant="body2" color="textSecondary">
              Orden de Compra: {cuenta.codigo_orden}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Resumen Financiero
            </Typography>
            <Grid container>
              <Grid item xs={4}>
                <Typography>Monto Original:</Typography>
                <Typography variant="h5">
                  ${cuenta.monto_original.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography>Monto Pagado:</Typography>
                <Typography variant="h5" color="success.main">
                  ${(cuenta.monto_original - cuenta.monto_pendiente).toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography>Monto Pendiente:</Typography>
                <Typography variant="h5" color="error.main">
                  ${cuenta.monto_pendiente.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Historial de Pagos
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha de Pago</TableCell>
                  <TableCell>Monto Pagado (USD)</TableCell>
                  <TableCell>Detalles de Pago (Método, Monto, Ref.)</TableCell>
                  <TableCell>Observación</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cuenta.pagos.map((pago) => (
                  <TableRow key={pago.id}>
                    <TableCell>
                      {new Date(pago.fecha_pago).toLocaleDateString()}
                    </TableCell>
                    <TableCell>${pago.monto_total_pagado.toFixed(2)}</TableCell>
                    <TableCell>
                      {pago.detalles.map((det, index) => (
                        <Typography key={index} variant="body2">
                          - {det.metodo}: {det.monto.toFixed(2)} {det.moneda}{" "}
                          {det.referencia && `(${det.referencia})`}
                        </Typography>
                      ))}
                    </TableCell>
                    <TableCell>{pago.observacion}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CuentaPorPagarDetailPage;
