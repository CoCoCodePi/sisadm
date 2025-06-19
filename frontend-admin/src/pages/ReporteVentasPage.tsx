import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Autocomplete,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import { useSnackbar } from "notistack";
import apiClient from "../api/client";
import { Cliente } from "../types/cliente";
import { User } from "../types/user";

interface FiltrosState {
  fechaInicio: Date | null;
  fechaFin: Date | null;
  clientesIDs: Cliente[];
  vendedoresIDs: User[];
}

const ReporteVentasPage = () => {
  const [filtros, setFiltros] = useState<FiltrosState>({
    fechaInicio: null,
    fechaFin: null,
    clientesIDs: [],
    vendedoresIDs: [],
  });
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vendedores, setVendedores] = useState<User[]>([]);
  const [reporteData, setReporteData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    apiClient.get("/clientes").then((res) => setClientes(res.data.data));
    apiClient.get("/auth/users").then((res) => setVendedores(res.data));
  }, []);

  const handleGenerateReport = async () => {
    if (!filtros.fechaInicio || !filtros.fechaFin) {
      enqueueSnackbar("Debe seleccionar un rango de fechas.", {
        variant: "error",
      });
      return;
    }
    setLoading(true);
    setReporteData(null);
    try {
      const payload = {
        fechaInicio: format(filtros.fechaInicio, "yyyy-MM-dd"),
        fechaFin: format(filtros.fechaFin, "yyyy-MM-dd"),
        clientesIDs: filtros.clientesIDs.map((c: any) => c.id),
        vendedoresIDs: filtros.vendedoresIDs.map((v: any) => v.id),
      };
      const res = await apiClient.post("/reportes/ventas-detallado", payload);
      setReporteData(res.data.data);
    } catch (error) {
      enqueueSnackbar("Error al generar el reporte", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Reporte de Ventas
      </Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <DatePicker
              label="Fecha de Inicio"
              value={filtros.fechaInicio}
              onChange={(val) =>
                setFiltros((f) => ({ ...f, fechaInicio: val }))
              }
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <DatePicker
              label="Fecha de Fin"
              value={filtros.fechaFin}
              onChange={(val) => setFiltros((f) => ({ ...f, fechaFin: val }))}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Autocomplete
              multiple
              options={clientes}
              // CORREGIDO: Se usa el ID para la comparación y se muestra más info en la etiqueta
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) =>
                `${option.nombre} (${option.tipo_documento}-${option.documento})`
              }
              onChange={(_, val) =>
                setFiltros((f) => ({ ...f, clientesIDs: val as any }))
              }
              renderInput={(params) => (
                <TextField {...params} label="Clientes (Opcional)" />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Autocomplete
              multiple
              options={vendedores}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(option) => option.nombre}
              onChange={(_, val) =>
                setFiltros((f) => ({ ...f, vendedoresIDs: val as any }))
              }
              renderInput={(params) => (
                <TextField {...params} label="Vendedores (Opcional)" />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleGenerateReport}
              disabled={!filtros.fechaInicio || !filtros.fechaFin || loading}
            >
              {loading ? <CircularProgress size={24} /> : "Generar Reporte"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading && <CircularProgress />}

      {reporteData && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6">Resultados del Reporte</Typography>
          <Grid container spacing={2} my={2}>
            <Grid item xs={12} sm={3}>
              <Typography>
                Nº de Ventas: <strong>{reporteData.totales.cantidad}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography>
                Subtotal:{" "}
                <strong>${reporteData.totales.subtotal.toFixed(2)}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography>
                IVA: <strong>${reporteData.totales.iva.toFixed(2)}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography>
                Total Ventas:{" "}
                <strong>${reporteData.totales.total.toFixed(2)}</strong>
              </Typography>
            </Grid>
          </Grid>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Código Venta</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Vendedor</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="center">Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reporteData.ventas.map((venta: any) => (
                  <TableRow key={venta.id} hover>
                    <TableCell>{venta.codigo_venta}</TableCell>
                    <TableCell>
                      {new Date(venta.fecha).toLocaleString()}
                    </TableCell>
                    <TableCell>{venta.cliente_nombre}</TableCell>
                    <TableCell>{venta.vendedor_nombre}</TableCell>
                    <TableCell align="right">
                      ${Number(venta.total_venta).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={venta.estado}
                        size="small"
                        color={
                          venta.estado === "completada" ? "success" : "warning"
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default ReporteVentasPage;
