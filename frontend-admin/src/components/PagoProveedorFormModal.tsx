import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Box,
  IconButton,
  Typography,
  Tooltip,
  Autocomplete,
  MenuItem,
  Stack,
  Paper,
  CircularProgress,
  Divider,
  Chip,
} from "@mui/material";
import {
  Close,
  AddCircleOutline,
  Delete,
  CurrencyExchange,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import apiClient from "../api/client";
import { MetodoPago } from "../types/metodoPago";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

interface PagoProveedorFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cuenta: any | null;
}

const PagoProveedorFormModal = ({
  open,
  onClose,
  onSuccess,
  cuenta,
}: PagoProveedorFormModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [pagos, setPagos] = useState([
    {
      id: `pay-${Date.now()}`,
      metodo_pago_id: "",
      monto: 0,
      moneda: "USD",
      referencia: "",
    },
  ]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [tasaCambio, setTasaCambio] = useState(0);
  const [fechaPago, setFechaPago] = useState<Date | null>(new Date());
  const [observacion, setObservacion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<"USD" | "VES">("USD");

  useEffect(() => {
    if (open) {
      apiClient
        .get("/metodos-pago")
        .then((res) =>
          setMetodosPago(res.data.data.filter((m: any) => m.habilitado))
        );
      apiClient
        .get("/tasas/actual")
        .then((res) => setTasaCambio(res.data.data.tasa));
      setPagos([
        {
          id: `pay-${Date.now()}`,
          metodo_pago_id: "",
          monto: cuenta?.monto_pendiente || 0,
          moneda: "USD",
          referencia: "",
        },
      ]);
      setFechaPago(new Date());
      setObservacion("");
    }
  }, [open, cuenta]);

  const totalAbonoUSD = useMemo(() => {
    return pagos.reduce((sum, pago) => {
      const monto = Number(pago.monto) || 0;
      if (pago.moneda === "VES") return sum + monto / (tasaCambio || 1);
      return sum + monto;
    }, 0);
  }, [pagos, tasaCambio]);

  const nuevoSaldoPendiente = (cuenta?.monto_pendiente || 0) - totalAbonoUSD;

  const handleAddPago = () =>
    setPagos((prev) => [
      ...prev,
      {
        id: `pay-${Date.now()}`,
        metodo_pago_id: "",
        monto: 0,
        moneda: "USD",
        referencia: "",
      },
    ]);
  const handleRemovePago = (id: string) =>
    setPagos((prev) => prev.filter((p) => p.id !== id));
  const handlePagoChange = (id: string, field: string, value: any) =>
    setPagos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );

  const handleSubmit = async () => {
    if (!fechaPago) {
      enqueueSnackbar("La fecha de pago es requerida.", { variant: "error" });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        fecha_pago: format(fechaPago, "yyyy-MM-dd"),
        observacion,
        detalles: pagos
          .filter((p) => p.monto > 0 && p.metodo_pago_id)
          .map((p) => ({
            ...p,
            monto: Number(p.monto),
            tasa_cambio: tasaCambio,
          })),
      };
      await apiClient.post(`/cuentas-por-pagar/${cuenta.id}/pagos`, payload);
      enqueueSnackbar("Pago registrado con éxito", { variant: "success" });
      onSuccess();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(
        error.response?.data?.message || "Error al registrar el pago",
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        Registrar Pago a Proveedor: {cuenta?.proveedor_nombre}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <DatePicker
              label="Fecha del Pago"
              value={fechaPago}
              onChange={setFechaPago}
              sx={{ width: "100%" }}
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Observación (Opcional)"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            />
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }}>
          {" "}
          <Chip label="Detalles del Pago" />{" "}
        </Divider>
        <Typography variant="h6" gutterBottom>
          Deuda Pendiente: ${Number(cuenta?.monto_pendiente).toFixed(2)}
        </Typography>
        <Stack spacing={2} mt={2}>
          {pagos.map((pago, index) => (
            <Paper key={pago.id} variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    options={metodosPago}
                    getOptionLabel={(m) => m.nombre}
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                    onChange={(_, nv) =>
                      handlePagoChange(pago.id, "metodo_pago_id", nv?.id || "")
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Método de Pago" />
                    )}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="Monto"
                    type="number"
                    value={pago.monto || ""}
                    onChange={(e) =>
                      handlePagoChange(pago.id, "monto", e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField
                    select
                    fullWidth
                    label="Moneda"
                    value={pago.moneda}
                    onChange={(e) =>
                      handlePagoChange(pago.id, "moneda", e.target.value)
                    }
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="VES">VES</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    label="Referencia"
                    value={pago.referencia}
                    onChange={(e) =>
                      handlePagoChange(pago.id, "referencia", e.target.value)
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={1} textAlign="right">
                  <IconButton onClick={() => handleRemovePago(pago.id)}>
                    <Delete color="error" />
                  </IconButton>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>
        <Button
          startIcon={<AddCircleOutline />}
          onClick={handleAddPago}
          sx={{ mt: 2 }}
        >
          Añadir Otro Método
        </Button>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ textAlign: "right" }}>
          <Stack
            direction="row"
            justifyContent="flex-end"
            alignItems="center"
            spacing={1}
          >
            <Chip label={`Tasa: ${tasaCambio.toFixed(2)} Bs./$`} size="small" />
            <Tooltip
              title={`Cambiar vista a ${
                displayCurrency === "USD" ? "VES" : "USD"
              }`}
            >
              <IconButton
                size="small"
                onClick={() =>
                  setDisplayCurrency((c) => (c === "USD" ? "VES" : "USD"))
                }
              >
                <CurrencyExchange />
              </IconButton>
            </Tooltip>
          </Stack>
          <Typography variant="h6" mt={1}>
            Total a Abonar: {formatCurrency(totalAbonoUSD)}
          </Typography>
          <Typography
            variant="h5"
            color={nuevoSaldoPendiente > 0 ? "error.main" : "success.main"}
          >
            Nuevo Saldo Pendiente: {formatCurrency(nuevoSaldoPendiente)}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} /> : "Confirmar Pago"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PagoProveedorFormModal;
