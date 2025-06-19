import { useState, useEffect, useMemo } from "react";
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
  Autocomplete,
  MenuItem,
  Stack,
  Paper,
  CircularProgress,
  Divider,
  Chip,
  Tooltip, // <-- AÑADIDO: Importar Tooltip
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
// import { format } from "date-fns"; // <-- ELIMINADO: No se usa en este componente

interface AbonoClienteFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cuenta: any | null;
}

const AbonoClienteFormModal = ({
  open,
  onClose,
  onSuccess,
  cuenta,
}: AbonoClienteFormModalProps) => {
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
  const [observaciones, setObservaciones] = useState(""); // <-- CORREGIDO: Observaciones (plural)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<"USD" | "VES">("USD");

  useEffect(() => {
    if (open) {
      apiClient
        .get("/metodos-pago")
        .then((res) =>
          setMetodosPago(res.data.data.filter((m: any) => m.habilitado))
        )
        .catch(() =>
          enqueueSnackbar("Error cargando métodos de pago", {
            variant: "error",
          })
        );
      apiClient
        .get("/tasas/actual")
        .then((res) => setTasaCambio(res.data.data.tasa))
        .catch(() =>
          enqueueSnackbar("Error cargando la tasa de cambio", {
            variant: "error",
          })
        );
      setPagos([
        {
          id: `pay-${Date.now()}`,
          metodo_pago_id: "",
          monto: cuenta?.monto_pendiente || 0,
          moneda: "USD",
          referencia: "",
        },
      ]);
      setObservaciones(""); // <-- CORREGIDO: setObservaciones
    }
  }, [open, cuenta, enqueueSnackbar]); // Asegúrate de añadir enqueueSnackbar a las dependencias

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
    setIsSubmitting(true);
    try {
      const payload = {
        observaciones, // <-- CORREGIDO: Observaciones
        tasa_cambio: tasaCambio,
        pagos: pagos
          .filter((p) => Number(p.monto) > 0 && p.metodo_pago_id)
          .map((p) => ({ ...p, monto: Number(p.monto) })),
      };
      await apiClient.post(`/cuentas-por-cobrar/${cuenta.id}/abonos`, payload);
      enqueueSnackbar("Abono registrado con éxito", { variant: "success" });
      onSuccess();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(
        error.response?.data?.message || "Error al registrar el abono",
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
        Registrar Abono de Cliente: {cuenta?.cliente_nombre}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          label="Observaciones (Opcional)"
          value={observaciones} // <-- CORREGIDO: Observaciones
          onChange={(e) => setObservaciones(e.target.value)} // <-- CORREGIDO: setObservaciones
          margin="normal"
        />
        <Divider sx={{ my: 2 }}>
          {" "}
          <Chip label="Detalles del Abono" />{" "}
        </Divider>
        <Typography variant="h6" gutterBottom>
          Deuda Pendiente: ${Number(cuenta?.monto_pendiente).toFixed(2)}
        </Typography>
        <Stack spacing={2} mt={2}>
          {pagos.map((pago) => (
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
                      handlePagoChange(pago.id, "monto", Number(e.target.value))
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
                      handlePagoChange(
                        pago.id,
                        "moneda",
                        e.target.value as "USD" | "VES"
                      )
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
            <Tooltip // <-- ESTE ES EL TOOLTIP IMPORTADO
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
          disabled={isSubmitting || totalAbonoUSD <= 0} // Deshabilitar si no hay abono
        >
          {isSubmitting ? <CircularProgress size={24} /> : "Registrar Abono"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AbonoClienteFormModal;
