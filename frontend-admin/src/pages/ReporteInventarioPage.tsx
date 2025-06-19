import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  useTheme,
  Alert,
} from "@mui/material";
import { FileDownload } from "@mui/icons-material";
import apiClient from "../api/client";

// Interfaz para dar un tipado estricto a los datos del reporte
interface InventarioReporteItem {
  producto_nombre: string;
  variante_nombre: string;
  stock_actual: number;
  costo_promedio: number;
  valor_total: number;
}

const ReporteInventarioPage = () => {
  const [reporteData, setReporteData] = useState<{
    inventario: InventarioReporteItem[];
    valorTotalInventario: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    setLoading(true);
    apiClient
      .get("/reportes/inventario-valorizado")
      .then((res) => setReporteData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCSV = () => {
    if (!reporteData || reporteData.inventario.length === 0) return;
    const headers = [
      "Producto",
      "Variante",
      "Stock Actual",
      "Costo Promedio ($)",
      "Valor Total ($)",
    ];

    const rows = reporteData.inventario.map((item: InventarioReporteItem) => [
      `"${item.producto_nombre}"`,
      `"${item.variante_nombre}"`,
      item.stock_actual,
      Number(item.costo_promedio).toFixed(2),
      Number(item.valor_total).toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: (string | number)[]) => row.join(",")),
    ].join("\n");
    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "reporte_inventario_valorizado.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box p={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Reporte de Inventario Valorizado</Typography>
        <Button
          variant="outlined"
          startIcon={<FileDownload />}
          onClick={handleExportCSV}
          disabled={!reporteData}
        >
          Exportar CSV
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : !reporteData || reporteData.inventario.length === 0 ? (
        <Alert severity="info">No hay inventario para mostrar.</Alert>
      ) : (
        <Box>
          <Paper
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: theme.palette.primary.light,
              color: theme.palette.primary.contrastText,
            }}
          >
            <Typography variant="h6">
              Valor Total del Inventario (a costo): $
              {Number(reporteData.valorTotalInventario).toFixed(2)}
            </Typography>
          </Paper>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Variante</TableCell>
                  <TableCell align="right">Stock Actual</TableCell>
                  <TableCell align="right">Costo Promedio Unit. ($)</TableCell>
                  <TableCell align="right">Valor Total en Stock ($)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reporteData.inventario.map((item, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{item.producto_nombre}</TableCell>
                    <TableCell>{item.variante_nombre}</TableCell>
                    <TableCell align="right">{item.stock_actual}</TableCell>
                    <TableCell align="right">
                      ${Number(item.costo_promedio).toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      ${Number(item.valor_total).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default ReporteInventarioPage;
