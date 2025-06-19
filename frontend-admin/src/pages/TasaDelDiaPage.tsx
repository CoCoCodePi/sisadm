// Contenido 100% Completo para el NUEVO archivo: frontend/src/pages/TasaDelDiaPage.tsx

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { PriceChange } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import apiClient from "../api/client";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

interface TasaHistorica {
  id: number;
  fecha: string;
  tasa_usd: number;
  fuente: string;
}

const TasaDelDiaPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [fecha, setFecha] = useState<Date | null>(new Date());
  const [tasa, setTasa] = useState<number>(0);
  const [historial, setHistorial] = useState<TasaHistorica[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadHistorial = () => {
    setLoading(true);
    apiClient
      .get("/tasas")
      .then((res) => setHistorial(res.data.data || []))
      .catch(() =>
        enqueueSnackbar("Error al cargar historial de tasas", {
          variant: "error",
        })
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHistorial();
  }, []);

  const handleSubmit = async () => {
    if (!fecha || tasa <= 0) {
      enqueueSnackbar("Debe seleccionar una fecha y una tasa mayor a cero.", {
        variant: "error",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        fecha: fecha.toISOString().slice(0, 10),
        tasa_usd: tasa,
      };
      await apiClient.post("/tasas", payload);
      enqueueSnackbar("Tasa del día guardada con éxito.", {
        variant: "success",
      });
      loadHistorial(); // Recargar el historial
    } catch (error: any) {
      enqueueSnackbar(
        error.response?.data?.message || "Error guardando la tasa.",
        { variant: "error" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        sx={{ mb: 3, display: "flex", alignItems: "center" }}
      >
        <PriceChange sx={{ mr: 1 }} />
        Gestión de Tasa de Cambio
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Registrar Tasa del Día
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <DatePicker
              label="Fecha"
              value={fecha}
              onChange={setFecha}
              sx={{ width: "100%" }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Tasa (Bs. por USD)"
              type="number"
              fullWidth
              value={tasa}
              onChange={(e) => setTasa(Number(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : "Guardar Tasa"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h6" gutterBottom>
        Historial Reciente
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Tasa (Bs. por USD)</TableCell>
                <TableCell>Fuente</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historial.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Alert severity="info">
                      No hay tasas registradas en el historial.
                    </Alert>
                  </TableCell>
                </TableRow>
              )}
              {historial.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>
                    {new Date(h.fecha).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{h.tasa_usd}</TableCell>
                  <TableCell>{h.fuente}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default TasaDelDiaPage;
