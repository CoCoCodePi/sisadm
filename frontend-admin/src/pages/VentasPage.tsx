import { useState, useEffect } from "react";
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
  Pagination,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Stack,
} from "@mui/material";
import { Receipt, Visibility, FileDownload } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format } from "date-fns";
import apiClient from "../api/client";

const VentasPage = () => {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
  });
  const [filtroFecha, setFiltroFecha] = useState<Date | null>(null);

  useEffect(() => {
    setLoading(true);

    const params: any = {
      page: pagination.page,
      limit: pagination.limit,
    };

    if (filtroFecha) {
      const formattedDate = format(filtroFecha, "yyyy-MM-dd");
      params.fechaInicio = formattedDate;
      params.fechaFin = formattedDate;
    }

    apiClient
      .get("/ventas", { params })
      .then((res) => {
        if (res.data.success) {
          setVentas(res.data.data);
          setPagination((prev) => ({ ...prev, total: res.data.total }));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [pagination.page, pagination.limit, filtroFecha]);

  const handleExportCSV = () => {
    if (ventas.length === 0) return;
    const headers = [
      "Codigo Venta",
      "Fecha",
      "Cliente",
      "Vendedor",
      "Total ($)",
      "Estado",
    ];
    const rows = ventas.map((venta) => [
      venta.codigo_venta,
      new Date(venta.fecha).toLocaleString(),
      `"${venta.cliente_nombre || "N/A"}"`,
      `"${venta.vendedor_nombre || "N/A"}"`,
      Number(venta.total_venta).toFixed(2),
      venta.estado,
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "reporte_ventas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" sx={{ display: "flex", alignItems: "center" }}>
          <Receipt sx={{ mr: 1 }} />
          Historial de Ventas
        </Typography>
        <Stack direction="row" spacing={1}>
          <DatePicker
            label="Filtrar por Día"
            value={filtroFecha}
            onChange={(newValue) => setFiltroFecha(newValue)}
            slotProps={{ textField: { size: "small" } }}
          />
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={handleExportCSV}
          >
            Exportar CSV
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : ventas.length === 0 ? (
        <Alert severity="info">
          No se encontraron ventas para los filtros seleccionados.
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Código Venta</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Vendedor</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ventas.map((venta) => (
                  <TableRow key={venta.id} hover>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {venta.codigo_venta}
                    </TableCell>
                    <TableCell>
                      {new Date(venta.fecha).toLocaleString()}
                    </TableCell>
                    <TableCell>{venta.cliente_nombre || "N/A"}</TableCell>
                    <TableCell>{venta.vendedor_nombre || "N/A"}</TableCell>
                    <TableCell align="right">
                      ${Number(venta.total_venta).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={venta.estado}
                        color={
                          venta.estado === "completada" ? "success" : "warning"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver Detalle">
                        <IconButton
                          onClick={() =>
                            navigate(`/ventas/detalle/${venta.id}`)
                          }
                        >
                          <Visibility color="primary" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
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
    </Box>
  );
};

export default VentasPage;
