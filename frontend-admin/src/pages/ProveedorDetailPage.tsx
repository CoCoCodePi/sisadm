import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Divider,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Alert,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import apiClient from "../api/client";
import { Proveedor } from "../types/proveedor";

interface CompraHistorial {
  id: number;
  codigo_orden: string;
  fecha_orden: string;
  total: number;
  moneda: string;
  estado: string;
  estado_pago: string;
}

const ProveedorDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [compras, setCompras] = useState<CompraHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProveedor = apiClient.get(`/proveedores/${id}`);
    const fetchCompras = apiClient.get("/compras", {
      params: { proveedor_id: id, limit: 100 },
    });

    Promise.all([fetchProveedor, fetchCompras])
      .then(([proveedorRes, comprasRes]) => {
        if (proveedorRes.data.success) {
          setProveedor(proveedorRes.data.data);
        } else {
          throw new Error("Proveedor no encontrado");
        }
        if (comprasRes.data.success) {
          setCompras(comprasRes.data.data);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Error al cargar los datos del proveedor.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!proveedor)
    return <Alert severity="info">No se encontró el proveedor.</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ ml: 2 }}>
          Detalle del Proveedor
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h5" gutterBottom>
              {proveedor.nombre}
            </Typography>
            <Typography variant="body1">
              <strong>RIF:</strong> {proveedor.rif}
            </Typography>
            <Typography variant="body1">
              <strong>Contacto:</strong> {proveedor.contacto_nombre}
            </Typography>
            <Typography variant="body1">
              <strong>Teléfono:</strong> {proveedor.telefono}
            </Typography>
            <Typography variant="body1">
              <strong>Email:</strong> {proveedor.email || "N/A"}
            </Typography>
            <Typography variant="body1">
              <strong>Dirección:</strong> {proveedor.direccion}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1">
              <strong>Días de Crédito:</strong> {proveedor.dias_credito}
            </Typography>
            <Typography variant="body1">
              <strong>Cuenta Bancaria:</strong>{" "}
              {proveedor.cuenta_bancaria || "N/A"}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Historial de Compras
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Código Orden</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Estado Pago</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {compras.map((compra) => (
                    <TableRow key={compra.id} hover>
                      <TableCell>
                        <Link to={`/compras/detalle/${compra.id}`}>
                          {compra.codigo_orden}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {new Date(compra.fecha_orden).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {compra.total.toFixed(2)} {compra.moneda}
                      </TableCell>
                      <TableCell>
                        <Chip label={compra.estado} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={compra.estado_pago} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProveedorDetailPage;
