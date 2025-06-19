import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Collapse,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  TableSortLabel,
  Button,
} from "@mui/material";
import {
  Inventory2,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Search,
  Delete,
  FileDownload,
  ArrowForward,
} from "@mui/icons-material";
import apiClient from "../api/client";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import ConfirmationDialog from "../components/ConfirmationDialog";

// Interfaces
interface LoteDetalle {
  lote_id: number;
  numero_lote: string;
  cantidad_en_lote: number;
  proveedor_id: number;
  proveedor_nombre: string;
  fecha_vencimiento: string | null;
  compra_estado: "recibida" | "cancelada";
}

interface InventarioVariante {
  variante_id: number;
  variante_nombre: string;
  variante_contenido: number;
  producto_nombre: string;
  marca_nombre: string;
  unidad_medida_base: string;
  stock_total: number | null;
  lotes: LoteDetalle[] | null;
  tiene_lotes_anulados: number;
}

type Order = "asc" | "desc";

// Componente para la fila expandible
const ExpandableRow = ({
  item,
  onAdjustLot,
}: {
  item: InventarioVariante;
  onAdjustLot: (loteId: number) => void;
}) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const activeLots =
    item.lotes?.filter((l) => l.compra_estado !== "cancelada") || [];
  const annulledLots =
    item.lotes?.filter((l) => l.compra_estado === "cancelada") || [];

  const annulledRowStyle = {
    backgroundColor: item.tiene_lotes_anulados
      ? "rgba(255, 0, 0, 0.05)"
      : "transparent",
    "& > *": { borderBottom: "unset" },
  };

  return (
    <React.Fragment>
      <TableRow hover sx={annulledRowStyle}>
        <TableCell sx={{ width: "5%" }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant="body1" fontWeight="bold">
            {item.producto_nombre}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {item.marca_nombre}
          </Typography>
        </TableCell>
        <TableCell>{`${item.variante_nombre} (${item.variante_contenido} ${item.unidad_medida_base})`}</TableCell>
        <TableCell align="center">
          <Typography variant="h5" fontWeight="bold">
            {item.stock_total || 0}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ padding: 0 }} colSpan={4}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box
              sx={{
                margin: 1,
                padding: 2,
                backgroundColor: "background.default",
                borderRadius: 2,
              }}
            >
              {annulledLots.length > 0 && (
                <Paper
                  sx={{
                    p: 2,
                    mb: 2,
                    border: "1px solid",
                    borderColor: "error.light",
                  }}
                  elevation={2}
                >
                  <Typography variant="h6" gutterBottom color="error.main">
                    Lotes de Compras Anuladas
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Lote</TableCell>
                        <TableCell>Proveedor</TableCell>
                        <TableCell>Cantidad</TableCell>
                        <TableCell>Acción</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {annulledLots.map((lote) => (
                        <TableRow
                          key={lote.lote_id}
                          sx={{ backgroundColor: "rgba(255, 0, 0, 0.05)" }}
                        >
                          <TableCell>
                            <Chip
                              label={lote.numero_lote}
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={lote.proveedor_nombre}
                              size="small"
                              onClick={() =>
                                navigate(
                                  `/proveedores/detalle/${lote.proveedor_id}`
                                )
                              }
                              icon={<ArrowForward />}
                              clickable
                            />
                          </TableCell>
                          <TableCell>{lote.cantidad_en_lote}</TableCell>
                          <TableCell>
                            <Tooltip title="Dar Salida del Inventario">
                              <IconButton
                                size="small"
                                onClick={() => onAdjustLot(lote.lote_id)}
                              >
                                <Delete color="error" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              )}
              <Typography variant="h6" gutterBottom>
                Lotes Activos
              </Typography>
              {activeLots.length > 0 ? (
                <TableContainer component={Paper} elevation={2}>
                  <Table size="small" aria-label="lotes-activos">
                    <TableHead>
                      <TableRow>
                        <TableCell>Número de Lote</TableCell>
                        <TableCell>Proveedor</TableCell>
                        <TableCell align="right">Cantidad en Lote</TableCell>
                        <TableCell>Fecha de Vencimiento</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeLots.map((lote) => (
                        <TableRow key={lote.lote_id}>
                          <TableCell>
                            <Chip
                              label={lote.numero_lote}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={lote.proveedor_nombre}
                              size="small"
                              variant="outlined"
                              onClick={() =>
                                navigate(
                                  `/proveedores/detalle/${lote.proveedor_id}`
                                )
                              }
                              clickable
                            />
                          </TableCell>
                          <TableCell align="right">
                            {lote.cantidad_en_lote}
                          </TableCell>
                          <TableCell>
                            {lote.fecha_vencimiento
                              ? new Date(
                                  lote.fecha_vencimiento
                                ).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" variant="outlined">
                  No hay lotes activos para esta variante.
                </Alert>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

// Componente principal de la página
const InventarioPage = () => {
  const [inventario, setInventario] = useState<InventarioVariante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<keyof InventarioVariante>(
    "tiene_lotes_anulados"
  );
  const [loteToAdjust, setLoteToAdjust] = useState<number | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const fetchInventario = useCallback(() => {
    setLoading(true);
    apiClient
      .get("/inventario")
      .then((response) => {
        if (response.data.success) {
          setInventario(response.data.data || []);
        } else {
          throw new Error(
            response.data.message || "Error al cargar el inventario"
          );
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "No se pudo conectar con el servidor.");
      })
      .finally(() => setLoading(false));
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchInventario();
  }, [fetchInventario]);

  const handleRequestSort = (property: keyof InventarioVariante) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleAdjustLot = async () => {
    if (!loteToAdjust) return;
    try {
      await apiClient.post("/inventario/ajuste", {
        lote_id: loteToAdjust,
        motivo: `Ajuste por anulación de compra desde Módulo de Inventario`,
      });
      enqueueSnackbar("Lote dado de baja correctamente.", {
        variant: "success",
      });
      // --- CORRECCIÓN: Volver a cargar los datos para refrescar la UI ---
      fetchInventario();
    } catch (error: any) {
      enqueueSnackbar(
        error.response?.data?.message || "Error al ajustar el lote.",
        { variant: "error" }
      );
    } finally {
      setLoteToAdjust(null);
    }
  };

  const handleExportCSV = () => {
    if (sortedAndFilteredInventario.length === 0) {
      enqueueSnackbar("No hay datos de inventario para exportar.", {
        variant: "info",
      });
      return;
    }
    const headers = [
      "Producto",
      "Marca",
      "Variante",
      "Contenido",
      "Unidad",
      "Stock Total",
      "Tiene Lotes Anulados",
      "Numero de Lote",
      "Cantidad en Lote",
      "Proveedor",
      "Fecha de Vencimiento",
      "Estado de Compra",
    ];
    const rows = sortedAndFilteredInventario.flatMap((item) =>
      item.lotes
        ? item.lotes.map((lote) => [
            `"${item.producto_nombre}"`,
            `"${item.marca_nombre}"`,
            `"${item.variante_nombre}"`,
            item.variante_contenido,
            `"${item.unidad_medida_base}"`,
            item.stock_total || 0,
            item.tiene_lotes_anulados ? "SI" : "NO",
            `"${lote.numero_lote}"`,
            lote.cantidad_en_lote,
            `"${lote.proveedor_nombre}"`,
            lote.fecha_vencimiento
              ? new Date(lote.fecha_vencimiento).toLocaleDateString()
              : "N/A",
            `"${lote.compra_estado}"`,
          ])
        : []
    );

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "reporte_inventario.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedAndFilteredInventario = useMemo(() => {
    let filtered = inventario.filter(
      (item) =>
        item.producto_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.variante_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.marca_nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      if (a.tiene_lotes_anulados !== b.tiene_lotes_anulados) {
        return b.tiene_lotes_anulados - a.tiene_lotes_anulados;
      }

      const valA = a[orderBy as keyof Omit<InventarioVariante, "lotes">] ?? 0;
      const valB = b[orderBy as keyof Omit<InventarioVariante, "lotes">] ?? 0;

      if (typeof valA === "number" && typeof valB === "number") {
        return order === "asc" ? valA - valB : valB - valA;
      }

      return 0;
    });

    return filtered;
  }, [inventario, searchTerm, order, orderBy]);

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ display: "flex", alignItems: "center" }}>
          <Inventory2 sx={{ mr: 1 }} />
          Gestión de Inventario
        </Typography>
        <Button
          variant="outlined"
          startIcon={<FileDownload />}
          onClick={handleExportCSV}
        >
          Exportar CSV
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2, elevation: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Buscar por Producto, Variante o Marca"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : sortedAndFilteredInventario.length === 0 ? (
        <Alert severity="info">
          No se encontraron artículos en el inventario.
        </Alert>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table aria-label="collapsible table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: "5%" }} />
                <TableCell>Producto / Marca</TableCell>
                <TableCell>Variante (Contenido)</TableCell>
                <TableCell
                  align="center"
                  sortDirection={orderBy === "stock_total" ? order : false}
                  sx={{ width: "15%" }}
                >
                  <TableSortLabel
                    active={orderBy === "stock_total"}
                    direction={orderBy === "stock_total" ? order : "asc"}
                    onClick={() => handleRequestSort("stock_total")}
                  >
                    Stock Total
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedAndFilteredInventario.map((item) => (
                <ExpandableRow
                  key={item.variante_id}
                  item={item}
                  onAdjustLot={setLoteToAdjust}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ConfirmationDialog
        open={!!loteToAdjust}
        title="Confirmar Salida de Inventario"
        content="¿Está seguro de que desea dar de baja este lote? Esta acción registrará una salida por la cantidad total del lote y no se puede deshacer."
        onConfirm={handleAdjustLot}
        onClose={() => setLoteToAdjust(null)}
        confirmText="Confirmar Salida"
        confirmColor="error"
      />
    </Box>
  );
};

export default InventarioPage;
