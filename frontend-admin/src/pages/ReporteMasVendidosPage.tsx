import { useState } from "react";
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
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import { useSnackbar } from "notistack";
import apiClient from "../api/client";

const ReporteMasVendidosPage = () => {
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [reporteData, setReporteData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleGenerateReport = async () => {
    if (!fechaInicio || !fechaFin) {
      enqueueSnackbar("Debe seleccionar un rango de fechas.", {
        variant: "error",
      });
      return;
    }
    setLoading(true);
    setReporteData([]);
    try {
      const payload = {
        fechaInicio: format(fechaInicio, "yyyy-MM-dd"),
        fechaFin: format(fechaFin, "yyyy-MM-dd"),
      };
      const res = await apiClient.post("/reportes/mas-vendidos", payload);
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
        Reporte de Productos Más Vendidos
      </Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <DatePicker
              label="Fecha de Inicio"
              value={fechaInicio}
              onChange={setFechaInicio}
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <DatePicker
              label="Fecha de Fin"
              value={fechaFin}
              onChange={setFechaFin}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleGenerateReport}
              disabled={!fechaInicio || !fechaFin || loading}
            >
              {loading ? <CircularProgress size={24} /> : "Generar"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {reporteData.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Variante</TableCell>
                <TableCell align="center">Unidades Vendidas</TableCell>
                <TableCell align="right">Ingresos Generados ($)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reporteData.map((item: any, index: number) => (
                <TableRow key={index} hover>
                  <TableCell>{item.producto_nombre}</TableCell>
                  <TableCell>{item.variante_nombre}</TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: "bold", fontSize: "1.1rem" }}
                  >
                    {item.total_unidades_vendidas}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    ${Number(item.total_ingresos_generados).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ReporteMasVendidosPage;
