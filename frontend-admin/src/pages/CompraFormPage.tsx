import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  IconButton,
  Autocomplete,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Tooltip,
  MenuItem,
  TableContainer,
  Stack,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
} from "@mui/material";
import { ArrowBack, QrCodeScanner, Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import apiClient from "../api/client";
import { Proveedor, ProveedorFormData } from "../types/proveedor";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import ProveedorForm from "../components/ProveedorForm";

interface ItemCompra {
  key: string;
  variante_id: number;
  producto_nombre: string;
  variante_nombre: string;
  cantidad: number;
  costo_unitario: number;
  numero_lote: string;
  // --- AÑADIDO: Campo para fecha de vencimiento ---
  fecha_vencimiento?: Date | null;
}

const CompraFormPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [allProveedores, setAllProveedores] = useState<Proveedor[]>([]);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(
    null
  );
  const [fechaOrden, setFechaOrden] = useState<Date | null>(new Date());
  const [tasaCambio, setTasaCambio] = useState<number>(0);
  const [moneda, setMoneda] = useState<"USD" | "VES">("USD");
  const [items, setItems] = useState<ItemCompra[]>([]);

  const [barcodeInput, setBarcodeInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [proveedorModalOpen, setProveedorModalOpen] = useState(false);

  useEffect(() => {
    // Cargar proveedores y tasa de cambio actual al montar el componente
    apiClient
      .get("/proveedores?limit=1000") // Cargar todos los proveedores
      .then((res) => {
        setAllProveedores(res.data?.data || []);
      })
      .catch((err) => {
        console.error("Error cargando proveedores", err);
        enqueueSnackbar("Error al cargar la lista de proveedores", {
          variant: "error",
        });
      });

    apiClient
      .get("/tasas/actual")
      .then((res) => {
        if (res.data.success) setTasaCambio(res.data.data.tasa);
      })
      .catch(() =>
        enqueueSnackbar("Error al cargar la tasa de cambio del día", {
          variant: "error",
        })
      );
  }, [enqueueSnackbar]);

  const handleBarcodeLookup = useCallback(async () => {
    if (!barcodeInput.trim()) return;
    setLookupLoading(true);
    try {
      const res = await apiClient.get(
        `/productos/lookup/${barcodeInput.trim()}`
      );
      if (res.data.success) {
        const product = res.data.data;
        const variant = product.variantes.find(
          (v: any) => v.id === product.variante_encontrada_id
        );

        if (items.some((item) => item.variante_id === variant.id)) {
          enqueueSnackbar("Esta variante ya está en la lista de compra.", {
            variant: "info",
          });
          setBarcodeInput("");
          return;
        }

        const newItem: ItemCompra = {
          key: `item-${variant.id}`,
          variante_id: variant.id,
          producto_nombre: product.nombre,
          variante_nombre: variant.nombre,
          cantidad: 1,
          costo_unitario: 0,
          numero_lote: "",
          fecha_vencimiento: null,
        };
        setItems((prev) => [newItem, ...prev]);
        setBarcodeInput("");
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        enqueueSnackbar(
          "Código de barras no encontrado. Por favor, regístrelo en el Módulo de Productos.",
          { variant: "error", autoHideDuration: 6000 }
        );
      } else {
        enqueueSnackbar("Error buscando producto", { variant: "error" });
      }
    } finally {
      setLookupLoading(false);
    }
  }, [barcodeInput, enqueueSnackbar, items]);

  const handleItemChange = (
    index: number,
    field: keyof Omit<ItemCompra, "key">,
    value: any
  ) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProviderSubmit = async (formData: ProveedorFormData) => {
    try {
      const payload = { ...formData, rif: `J-${formData.rif_suffix}` };
      const response = await apiClient.post("/proveedores", payload);
      const newProvider = {
        ...payload,
        id: response.data.data.id,
        dias_credito: formData.dias_credito,
      };

      setAllProveedores((prev) => [...prev, newProvider]);
      setSelectedProveedor(newProvider);
      enqueueSnackbar("Proveedor creado y seleccionado", {
        variant: "success",
      });
      setProveedorModalOpen(false);
    } catch (error: any) {
      enqueueSnackbar(
        error.response?.data?.message || "Error al crear proveedor",
        { variant: "error" }
      );
    }
  };

  // --- AÑADIDO: Cálculo del total de la compra en tiempo real ---
  const totalCompra = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + item.cantidad * item.costo_unitario,
      0
    );
  }, [items]);

  const handleSubmit = async () => {
    // --- MEJORADO: Validación más estricta antes de enviar ---
    if (!selectedProveedor || !fechaOrden) {
      enqueueSnackbar("Debe seleccionar un Proveedor y una Fecha de Orden.", {
        variant: "error",
      });
      return;
    }
    if (items.length === 0) {
      enqueueSnackbar("La compra debe tener al menos un artículo.", {
        variant: "error",
      });
      return;
    }
    if (moneda === "VES" && (!tasaCambio || tasaCambio <= 0)) {
      enqueueSnackbar("Si usa VES, la tasa de cambio debe ser mayor a cero.", {
        variant: "error",
      });
      return;
    }

    // Validación por cada item
    for (const item of items) {
      if (!item.numero_lote?.trim()) {
        enqueueSnackbar(
          `El artículo '${item.producto_nombre}' debe tener un número de lote.`,
          { variant: "error" }
        );
        return;
      }
      if (!item.cantidad || item.cantidad <= 0) {
        enqueueSnackbar(
          `El artículo '${item.producto_nombre}' debe tener una cantidad mayor a cero.`,
          { variant: "error" }
        );
        return;
      }
      if (!item.costo_unitario || item.costo_unitario <= 0) {
        enqueueSnackbar(
          `El artículo '${item.producto_nombre}' debe tener un costo unitario mayor a cero.`,
          { variant: "error" }
        );
        return;
      }
    }

    setIsSubmitting(true);
    const payload = {
      proveedor_id: selectedProveedor.id,
      fecha_orden: fechaOrden.toISOString().slice(0, 10),
      moneda,
      tasa_cambio: tasaCambio,
      items: items.map((item) => ({
        variante_id: item.variante_id,
        cantidad: Number(item.cantidad),
        costo_unitario: Number(item.costo_unitario),
        numero_lote: item.numero_lote,
        fecha_vencimiento: item.fecha_vencimiento
          ? item.fecha_vencimiento.toISOString().slice(0, 10)
          : null,
      })),
    };

    try {
      await apiClient.post("/compras", payload);
      enqueueSnackbar("Compra registrada con éxito!", { variant: "success" });
      navigate("/compras");
    } catch (error: any) {
      enqueueSnackbar(
        error.response?.data?.message || "Error al registrar la compra",
        { variant: "error" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton onClick={() => navigate("/compras")}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">Registrar Nueva Compra</Typography>
      </Stack>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={5}>
            <Autocomplete
              options={allProveedores}
              getOptionLabel={(option) => `${option.nombre} (${option.rif})`}
              value={selectedProveedor}
              onChange={(_, newValue) => setSelectedProveedor(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Seleccionar Proveedor" required />
              )}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              onClick={() => setProveedorModalOpen(true)}
              variant="outlined"
              fullWidth
            >
              Crear Proveedor
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <DatePicker
              label="Fecha de la Orden"
              value={fechaOrden}
              onChange={(newValue) => setFechaOrden(newValue)}
              sx={{ width: "100%" }}
            />
          </Grid>
          <Grid item xs={6} md={1.5}>
            <TextField
              select
              fullWidth
              label="Moneda"
              value={moneda}
              onChange={(e) => setMoneda(e.target.value as "USD" | "VES")}
            >
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="VES">VES</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <TextField
              fullWidth
              type="number"
              label="Tasa de Cambio"
              value={tasaCambio}
              // --- MODIFICADO: Se añade InputProps con readOnly ---
              InputProps={{
                readOnly: true,
              }}
              helperText="Solo lectura"
              required
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" mb={2}>
              Añadir Artículos a la Compra
            </Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Escanear o Ingresar Código de Barras"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleBarcodeLookup();
                  }
                }}
                InputProps={{
                  endAdornment: lookupLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Tooltip title="Buscar">
                      <IconButton onClick={handleBarcodeLookup}>
                        <QrCodeScanner />
                      </IconButton>
                    </Tooltip>
                  ),
                }}
              />
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Producto / Variante
                    </TableCell>
                    <TableCell sx={{ width: "15%", fontWeight: "bold" }}>
                      Lote
                    </TableCell>
                    {/* --- AÑADIDO: Columna para Fecha de Vencimiento --- */}
                    <TableCell sx={{ width: "15%", fontWeight: "bold" }}>
                      Fecha Vencimiento
                    </TableCell>
                    <TableCell sx={{ width: "10%", fontWeight: "bold" }}>
                      Cantidad
                    </TableCell>
                    <TableCell sx={{ width: "15%", fontWeight: "bold" }}>
                      Costo Unitario ({moneda})
                    </TableCell>
                    <TableCell sx={{ width: "5%", fontWeight: "bold" }}>
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.key}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {item.producto_nombre}
                        </Typography>
                        <Typography variant="caption">
                          {item.variante_nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          variant="standard"
                          value={item.numero_lote}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "numero_lote",
                              e.target.value
                            )
                          }
                          required
                        />
                      </TableCell>
                      {/* --- AÑADIDO: Input para Fecha de Vencimiento --- */}
                      <TableCell>
                        <DatePicker
                          value={item.fecha_vencimiento}
                          onChange={(newValue) =>
                            handleItemChange(
                              index,
                              "fecha_vencimiento",
                              newValue
                            )
                          }
                          slotProps={{
                            textField: { variant: "standard", fullWidth: true },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          variant="standard"
                          type="number"
                          value={item.cantidad}
                          onChange={(e) =>
                            handleItemChange(index, "cantidad", e.target.value)
                          }
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          variant="standard"
                          type="number"
                          value={item.costo_unitario}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "costo_unitario",
                              e.target.value
                            )
                          }
                          required
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                {moneda === "USD" ? "$" : "Bs."}
                              </InputAdornment>
                            ),
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {/* --- AÑADIDO: Visualización del total --- */}
              <Typography variant="h5" fontWeight="bold">
                Total de la Compra: {moneda === "USD" ? "$" : "Bs."}
                {totalCompra.toFixed(2)}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={isSubmitting || items.length === 0}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Registrar Compra"
                )}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Dialog
        open={proveedorModalOpen}
        onClose={() => setProveedorModalOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Registrar Nuevo Proveedor</DialogTitle>
        <DialogContent>
          <ProveedorForm onSubmit={handleProviderSubmit} isEditing={false} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProveedorModalOpen(false)}>Cancelar</Button>
          <Button type="submit" form="proveedor-form" variant="contained">
            Crear Proveedor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompraFormPage;
