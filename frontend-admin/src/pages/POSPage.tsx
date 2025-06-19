import { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  MenuItem,
  TableContainer,
  Divider,
  InputAdornment,
  Stack,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  Chip,
} from "@mui/material";
import {
  Delete,
  PointOfSale,
  Search,
  Add,
  ArrowBack,
  QrCodeScanner,
  PersonAdd,
  CurrencyExchange,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import apiClient from "../api/client";
import { Producto, Variante } from "../types/producto";
import { Cliente } from "../types/cliente";
import { MetodoPago } from "../types/metodoPago";
import ClientForm from "../components/ClientForm";

// --- Interfaces y Constantes ---
interface CartItem {
  key: string;
  variante_id: number;
  producto_nombre: string;
  variante_nombre: string;
  cantidad: number;
  precio_unitario: number;
  stock_disponible: number;
  precios: { [key: string]: number };
  barcode: string;
}

interface PaymentDetail {
  id: string;
  metodo_pago_id: number | null;
  monto: number;
  moneda: "USD" | "VES";
  referencia: string;
}

const PRECIO_LABELS: { [key: string]: string } = {
  precio_1: "General",
  precio_2: "Mayorista",
  precio_3: "Especial 1",
  precio_4: "Especial 2",
};

const IVA_RATE = 0.16; // 16%

const POSPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clienteDocTipo, setClienteDocTipo] = useState("V");
  const [clienteDocNum, setClienteDocNum] = useState("");
  const [clienteLoading, setClienteLoading] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [carrito, setCarrito] = useState<CartItem[]>([]);

  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [pagos, setPagos] = useState<PaymentDetail[]>([]);
  const [tasaCambio, setTasaCambio] = useState<number>(0);
  const [displayCurrency, setDisplayCurrency] = useState<"USD" | "VES">("USD");

  const resetSaleState = () => {
    setCarrito([]);
    setPagos([]);
    setSelectedCliente(null);
    setClienteDocNum("");
    barcodeInputRef.current?.focus();
  };

  useEffect(() => {
    apiClient
      .get("/tasas/actual")
      .then((res) => {
        if (res.data.success) setTasaCambio(res.data.data.tasa || 0);
      })
      .catch(() =>
        enqueueSnackbar("Error al cargar la tasa de cambio del día", {
          variant: "error",
        })
      );

    apiClient
      .get("/metodos-pago")
      .then((res) => setMetodosPago(res.data.data || []));

    barcodeInputRef.current?.focus();
  }, [enqueueSnackbar]);

  const handleClientLookup = async () => {
    if (!clienteDocNum.trim()) return;
    setClienteLoading(true);
    try {
      const res = await apiClient.get(
        `/clientes/lookup/${clienteDocTipo}${clienteDocNum.trim()}`
      );
      if (res.data.success) {
        setSelectedCliente(res.data.data);
        enqueueSnackbar("Cliente encontrado.", { variant: "success" });
        barcodeInputRef.current?.focus();
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        enqueueSnackbar(
          "Cliente no encontrado. Puede registrarlo como nuevo.",
          { variant: "info" }
        );
        setSelectedCliente(null);
        setClientModalOpen(true);
      } else {
        enqueueSnackbar("Error buscando cliente.", { variant: "error" });
      }
    } finally {
      setClienteLoading(false);
    }
  };

  const handleClientSubmit = async (values: Partial<Cliente>) => {
    setIsSubmitting(true);
    try {
      const res = await apiClient.post("/clientes", values);
      if (res.data.success) {
        enqueueSnackbar("Cliente creado y seleccionado con éxito", {
          variant: "success",
        });
        setSelectedCliente(res.data.data);
        setClientModalOpen(false);
        barcodeInputRef.current?.focus();
      }
    } catch (error: any) {
      enqueueSnackbar(
        error.response?.data?.message || "Error al guardar cliente",
        { variant: "error" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBarcodeLookup = async (barcode: string) => {
    if (!barcode.trim()) return;
    const trimmedBarcode = barcode.trim();
    const existingCartItemIndex = carrito.findIndex(
      (item) => item.barcode === trimmedBarcode
    );

    if (existingCartItemIndex !== -1) {
      const item = carrito[existingCartItemIndex];
      if (item.cantidad < item.stock_disponible) {
        const newCart = [...carrito];
        newCart[existingCartItemIndex].cantidad++;
        setCarrito(newCart);
      } else {
        enqueueSnackbar("Máximo de stock alcanzado para este producto.", {
          variant: "warning",
        });
      }
      return;
    }

    setLookupLoading(true);
    try {
      const res = await apiClient.get(`/productos/lookup/${trimmedBarcode}`);
      if (res.data.success) {
        const product = res.data.data;
        const variant = product.variantes.find(
          (v: any) => v.id === product.variante_encontrada_id
        );

        if (variant) {
          const stockRes = await apiClient.get(
            `/inventario/stock/${variant.id}`
          );
          const stockDisponible = stockRes.data?.data?.stock || 0;

          if (stockDisponible <= 0) {
            enqueueSnackbar(
              `No hay stock disponible para ${product.nombre} - ${variant.nombre}.`,
              { variant: "error" }
            );
            return;
          }

          const newItem: CartItem = {
            key: `cart-${variant.id}`,
            variante_id: variant.id as number,
            producto_nombre: product.nombre,
            variante_nombre: variant.nombre,
            cantidad: 1,
            precio_unitario: variant.precio_1,
            stock_disponible: stockDisponible,
            precios: {
              precio_1: variant.precio_1,
              precio_2: variant.precio_2,
              precio_3: variant.precio_3,
              precio_4: variant.precio_4,
            },
            barcode: trimmedBarcode,
          };
          setCarrito((prev) => [newItem, ...prev]);
        }
      }
    } catch (error: any) {
      enqueueSnackbar(
        error.response?.data?.message || "Error buscando producto",
        { variant: "error" }
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCartChange = (
    index: number,
    field: "cantidad" | "precio_unitario",
    value: number
  ) => {
    setCarrito((prevCart) => {
      const newCart = [...prevCart];
      const item = newCart[index];
      if (field === "cantidad") {
        const newQty = Math.max(1, value); // No permitir cantidad menor a 1
        if (newQty > item.stock_disponible) {
          enqueueSnackbar("No se puede vender más de lo que hay en stock.", {
            variant: "warning",
          });
          item.cantidad = item.stock_disponible;
        } else {
          item.cantidad = newQty;
        }
      } else {
        item.precio_unitario = value;
      }
      return newCart;
    });
  };

  const handleRemoveFromCart = (key: string) =>
    setCarrito((prev) => prev.filter((item) => item.key !== key));
  const handleAddPayment = () =>
    setPagos((prev) => [
      ...prev,
      {
        id: `pay-${Date.now()}`,
        metodo_pago_id: null,
        monto: 0,
        moneda: "USD",
        referencia: "",
      },
    ]);
  const handlePaymentChange = (
    index: number,
    field: keyof Omit<PaymentDetail, "id">,
    value: any
  ) =>
    setPagos((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  const handleRemovePayment = (id: string) =>
    setPagos((prev) => prev.filter((p) => p.id !== id));

  const { subtotal, totalIVA, totalVenta } = useMemo(() => {
    const calculatedSubtotal = carrito.reduce(
      (sum, item) => sum + item.cantidad * item.precio_unitario,
      0
    );
    const calculatedIVA = calculatedSubtotal * IVA_RATE;
    const calculatedTotal = calculatedSubtotal + calculatedIVA;
    return {
      subtotal: calculatedSubtotal,
      totalIVA: calculatedIVA,
      totalVenta: calculatedTotal,
    };
  }, [carrito]);

  const totalPagado = useMemo(() => {
    return pagos.reduce((sum, pago) => {
      const montoEnUSD =
        pago.moneda === "VES" ? pago.monto / (tasaCambio || 1) : pago.monto;
      return sum + montoEnUSD;
    }, 0);
  }, [pagos, tasaCambio]);

  const montoRestante = useMemo(
    () => totalVenta - totalPagado,
    [totalVenta, totalPagado]
  );
  const vuelto = useMemo(
    () => (montoRestante < 0 ? Math.abs(montoRestante) : 0),
    [montoRestante]
  );

  const isSubmitDisabled = useMemo(() => {
    if (isSubmitting || carrito.length === 0 || !selectedCliente) {
      return true;
    }
    if (montoRestante > 0.01) {
      return !selectedCliente.permite_credito;
    }
    return false;
  }, [isSubmitting, carrito, montoRestante, selectedCliente]);

  const handleSubmit = async () => {
    if (!selectedCliente) {
      enqueueSnackbar("Debe seleccionar un cliente para la venta.", {
        variant: "error",
      });
      return;
    }

    if (montoRestante > 0.01 && !selectedCliente.permite_credito) {
      enqueueSnackbar(
        "Este cliente no tiene crédito habilitado. La venta debe ser pagada en su totalidad.",
        { variant: "error" }
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        cliente_id: selectedCliente.id,
        detalles: carrito.map((item) => ({
          variante_id: item.variante_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          iva_monto: item.precio_unitario * IVA_RATE,
        })),
        pagos: pagos.filter((p) => p.monto > 0 && p.metodo_pago_id),
        moneda: "USD",
        tasa_cambio: tasaCambio,
        canal: "fisico",
        subtotal,
        total_iva: totalIVA,
        total_venta: totalVenta,
      };

      await apiClient.post("/ventas", payload);
      enqueueSnackbar("Venta registrada con éxito", { variant: "success" });
      resetSaleState();
    } catch (error: any) {
      enqueueSnackbar(
        error.message ||
          error.response?.data?.message ||
          "Error al registrar la venta",
        { variant: "error" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const value = displayCurrency === "VES" ? amount * tasaCambio : amount;
    return `${displayCurrency === "VES" ? "Bs.S" : "$"}${value.toLocaleString(
      "es-VE",
      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    )}`;
  };

  return (
    <Box
      sx={{
        p: 2,
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <IconButton onClick={() => navigate("/dashboard")}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ display: "flex", alignItems: "center" }}>
          <PointOfSale sx={{ mr: 1 }} />
          Punto de Venta
        </Typography>
      </Stack>
      <Grid container spacing={2} sx={{ flexGrow: 1, overflow: "hidden" }}>
        <Grid
          item
          xs={12}
          md={7}
          sx={{ display: "flex", flexDirection: "column" }}
        >
          <Paper
            sx={{ p: 2, flexGrow: 1, display: "flex", flexDirection: "column" }}
          >
            <Typography variant="h6" gutterBottom>
              Carrito de Venta
            </Typography>
            <TextField
              fullWidth
              label="Escanear o Ingresar Código de Barras"
              autoFocus
              inputRef={barcodeInputRef}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleBarcodeLookup((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = "";
                }
              }}
              InputProps={{
                endAdornment: lookupLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <QrCodeScanner />
                ),
              }}
            />
            <TableContainer sx={{ flexGrow: 1, mt: 2 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="center">Cant.</TableCell>
                    <TableCell>Precio</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {carrito.map((item, index) => (
                    <TableRow key={item.key}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {item.producto_nombre}
                        </Typography>
                        <Typography variant="caption">
                          {item.variante_nombre}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          variant="standard"
                          value={item.cantidad}
                          onChange={(e) =>
                            handleCartChange(
                              index,
                              "cantidad",
                              Number(e.target.value)
                            )
                          }
                          inputProps={{ min: 1, max: item.stock_disponible }}
                          sx={{ width: "60px" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.precio_unitario}
                          onChange={(e) =>
                            handleCartChange(
                              index,
                              "precio_unitario",
                              Number(e.target.value)
                            )
                          }
                          variant="standard"
                          size="small"
                          sx={{ minWidth: "160px" }}
                        >
                          {Object.keys(item.precios)
                            .filter((key) => item.precios[key] > 0)
                            .map((precioKey) => (
                              <MenuItem
                                key={precioKey}
                                value={item.precios[precioKey]}
                              >
                                {`${PRECIO_LABELS[precioKey]}: $${item.precios[
                                  precioKey
                                ].toFixed(2)}`}
                              </MenuItem>
                            ))}
                        </Select>
                      </TableCell>
                      <TableCell align="right">
                        ${(item.cantidad * item.precio_unitario).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveFromCart(item.key)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid
          item
          xs={12}
          md={5}
          sx={{ display: "flex", flexDirection: "column" }}
        >
          <Paper
            sx={{ p: 2, flexGrow: 1, display: "flex", flexDirection: "column" }}
          >
            <Typography variant="h6" gutterBottom>
              Cliente y Pago
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <FormControl
                variant="outlined"
                size="small"
                sx={{ minWidth: 80 }}
              >
                <InputLabel>Doc.</InputLabel>
                <Select
                  value={clienteDocTipo}
                  onChange={(e) => setClienteDocTipo(e.target.value)}
                  label="Doc."
                >
                  <MenuItem value="V">V</MenuItem>
                  <MenuItem value="J">J</MenuItem>
                  <MenuItem value="E">E</MenuItem>
                  <MenuItem value="G">G</MenuItem>
                  <MenuItem value="P">P</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Documento del Cliente"
                size="small"
                value={clienteDocNum}
                onChange={(e) => setClienteDocNum(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleClientLookup();
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={handleClientLookup}>
                      {clienteLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Search />
                      )}
                    </IconButton>
                  ),
                }}
              />
              <Tooltip title="Registrar Nuevo Cliente">
                <IconButton onClick={() => setClientModalOpen(true)}>
                  <PersonAdd />
                </IconButton>
              </Tooltip>
            </Stack>
            {selectedCliente && (
              <Alert severity="success" icon={false} sx={{ mb: 2 }}>
                Cliente: <strong>{selectedCliente.nombre}</strong>
              </Alert>
            )}

            <Divider sx={{ mb: 2 }}>Métodos de Pago</Divider>
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              {pagos.map((pago, index) => (
                <Grid container spacing={1} key={pago.id} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <Select
                      fullWidth
                      size="small"
                      value={pago.metodo_pago_id || ""}
                      onChange={(e) =>
                        handlePaymentChange(
                          index,
                          "metodo_pago_id",
                          e.target.value
                        )
                      }
                      displayEmpty
                    >
                      <MenuItem value="" disabled>
                        Método
                      </MenuItem>
                      {metodosPago.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          {m.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label="Monto"
                      type="number"
                      value={pago.monto || ""}
                      onChange={(e) =>
                        handlePaymentChange(
                          index,
                          "monto",
                          Number(e.target.value)
                        )
                      }
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      select
                      fullWidth
                      label="Moneda"
                      value={pago.moneda}
                      onChange={(e) =>
                        handlePaymentChange(index, "moneda", e.target.value)
                      }
                      size="small"
                    >
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="VES">VES</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      label="Ref."
                      value={pago.referencia}
                      onChange={(e) =>
                        handlePaymentChange(index, "referencia", e.target.value)
                      }
                      size="small"
                    />
                  </Grid>
                </Grid>
              ))}
            </Stack>
            <Button
              onClick={handleAddPayment}
              size="small"
              startIcon={<Add />}
              sx={{ alignSelf: "flex-start" }}
            >
              Añadir Pago
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Divider sx={{ my: 2 }} />

            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Chip
                  label={`Tasa: ${tasaCambio.toFixed(2)} Bs./$`}
                  size="small"
                />
                <Tooltip
                  title={`Cambiar vista a ${
                    displayCurrency === "USD" ? "VES" : "USD"
                  }`}
                >
                  <IconButton
                    onClick={() =>
                      setDisplayCurrency((c) => (c === "USD" ? "VES" : "USD"))
                    }
                  >
                    <CurrencyExchange />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ mt: 1 }}
              >
                <Typography variant="body1">Subtotal:</Typography>
                <Typography variant="body1">
                  {formatCurrency(subtotal)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body1">IVA (16%):</Typography>
                <Typography variant="body1">
                  {formatCurrency(totalIVA)}
                </Typography>
              </Stack>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="h6">Total a Pagar:</Typography>
                <Typography variant="h6">
                  {formatCurrency(totalVenta)}
                </Typography>
              </Stack>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ mt: 1 }}
              >
                <Typography variant="body1">Total Pagado:</Typography>
                <Typography variant="body1" color="success.main">
                  {formatCurrency(totalPagado)}
                </Typography>
              </Stack>
              <Divider sx={{ my: 1 }} />
              {vuelto > 0 ? (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="h5" color="primary.main">
                    Vuelto:
                  </Typography>
                  <Typography variant="h5" color="primary.main">
                    {formatCurrency(vuelto)}
                  </Typography>
                </Stack>
              ) : (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="h5" color="error.main">
                    Restante:
                  </Typography>
                  <Typography variant="h5" color="error.main">
                    {formatCurrency(montoRestante)}
                  </Typography>
                </Stack>
              )}
            </Box>
            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 2 }}
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Finalizar Venta"
              )}
            </Button>
          </Paper>
        </Grid>
      </Grid>
      <Dialog
        open={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
        <DialogContent>
          <ClientForm
            initialValues={{
              tipo_documento: clienteDocTipo,
              documento: clienteDocNum,
              permite_credito: false,
              limite_credito: 0,
            }}
            onSubmit={handleClientSubmit}
            onCancel={() => setClientModalOpen(false)}
            loading={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default POSPage;
