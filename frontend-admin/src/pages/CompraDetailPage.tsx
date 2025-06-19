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

interface CompraDetalle {
  id: number;
  codigo_orden: string;
  fecha_orden: string;
  total: number;
  moneda: "USD" | "VES";
  tasa_cambio: number;
  estado: string;
  proveedor_nombre: string;
  proveedor_rif: string;
  items: {
    id: number;
    variante_id: number;
    cantidad: number;
    costo_unitario: number;
    variante_nombre: string;
    producto_nombre: string;
  }[];
}

const CompraDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [compra, setCompra] = useState<CompraDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient
      .get(`/compras/${id}`)
      .then((response) => {
        if (response.data.success) {
          setCompra(response.data.data);
        }
      })
      .catch((error) => {
        console.error("Error cargando detalle de la compra:", error);
        enqueueSnackbar("Error al cargar el detalle de la compra.", {
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

  if (!compra) {
    return <Typography>Compra no encontrada.</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate("/compras")}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ ml: 2 }}>
          Detalle de la Compra: {compra.codigo_orden}
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Proveedor</Typography>
            <Typography>
              {compra.proveedor_nombre} ({compra.proveedor_rif})
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Información General</Typography>
            <Typography>
              Fecha: {new Date(compra.fecha_orden).toLocaleDateString()}
            </Typography>
            <Typography>
              Estado:{" "}
              <Chip
                label={compra.estado}
                color={
                  compra.estado === "recibida"
                    ? "success"
                    : compra.estado === "anulada"
                    ? "error"
                    : "warning"
                }
              />
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Artículos Incluidos
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto / Variante</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Costo Unitario (USD)</TableCell>
                    <TableCell align="right">Subtotal (USD)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {compra.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.producto_nombre} ({item.variante_nombre})
                      </TableCell>
                      <TableCell align="right">{item.cantidad}</TableCell>
                      <TableCell align="right">
                        ${item.costo_unitario.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        ${(item.cantidad * item.costo_unitario).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid
            item
            xs={12}
            sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}
          >
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="subtitle1">
                Tasa de Cambio: {compra.tasa_cambio.toFixed(2)} Bs./USD
              </Typography>
              <Typography variant="h5">
                Total: {compra.total.toFixed(2)} {compra.moneda}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default CompraDetailPage;
