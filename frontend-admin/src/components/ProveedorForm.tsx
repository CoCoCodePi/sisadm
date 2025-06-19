import { useEffect } from "react";
import { TextField, Grid, Box, InputAdornment } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { ProveedorFormData, Proveedor } from "../types/proveedor";

interface ProveedorFormProps {
  initialValues?: Proveedor | null;
  onSubmit: (data: ProveedorFormData) => void;
  isEditing?: boolean;
}

const ProveedorForm = ({
  initialValues,
  onSubmit,
  isEditing = false,
}: ProveedorFormProps) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProveedorFormData>();

  useEffect(() => {
    if (initialValues) {
      // CORRECCIÓN: Usar el operador '??' para asegurar que nunca se pase null o undefined a los campos.
      // Si el valor es null/undefined, se usará una cadena vacía ''.
      const rifValue = (initialValues.rif || "").replace("J-", "");
      setValue("rif_suffix", rifValue);
      setValue("nombre", initialValues.nombre ?? "");
      setValue("telefono", initialValues.telefono ?? "");
      setValue("direccion", initialValues.direccion ?? "");
      setValue("contacto_nombre", initialValues.contacto_nombre ?? "");
      setValue("email", initialValues.email ?? "");
      setValue("dias_credito", initialValues.dias_credito ?? 0);
      setValue("cuenta_bancaria", initialValues.cuenta_bancaria ?? "");
    } else {
      // Resetea a los valores por defecto del useForm, que deben ser controlados.
      reset({
        rif_suffix: "",
        nombre: "",
        telefono: "",
        direccion: "",
        contacto_nombre: "",
        email: "",
        dias_credito: 0,
        cuenta_bancaria: "",
      });
    }
  }, [initialValues, setValue, reset]);

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} id="proveedor-form">
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="rif_suffix"
            control={control}
            defaultValue=""
            rules={{
              required: "Campo requerido",
              pattern: {
                value: /^\d{1,9}$/,
                message: "Máximo 9 dígitos numéricos",
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="RIF"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">J-</InputAdornment>
                  ),
                }}
                error={!!errors.rif_suffix}
                helperText={errors.rif_suffix?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="telefono"
            control={control}
            defaultValue=""
            rules={{
              required: "Campo requerido",
              pattern: { value: /^\d{11}$/, message: "Debe tener 11 dígitos" },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Teléfono"
                error={!!errors.telefono}
                helperText={errors.telefono?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="nombre"
            control={control}
            defaultValue=""
            rules={{ required: "Campo requerido" }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Nombre del Proveedor"
                error={!!errors.nombre}
                helperText={errors.nombre?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="contacto_nombre"
            control={control}
            defaultValue=""
            rules={{ required: "Campo requerido" }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Nombre del Contacto"
                error={!!errors.contacto_nombre}
                helperText={errors.contacto_nombre?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="direccion"
            control={control}
            defaultValue=""
            rules={{ required: "Campo requerido" }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Dirección"
                error={!!errors.direccion}
                helperText={errors.direccion?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="email"
            control={control}
            defaultValue=""
            rules={{
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Email inválido",
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Email"
                type="email"
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="dias_credito"
            control={control}
            defaultValue={0}
            rules={{
              required: "Campo requerido",
              min: { value: 0, message: "Mínimo 0 días" },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Días de Crédito"
                type="number"
                error={!!errors.dias_credito}
                helperText={errors.dias_credito?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="cuenta_bancaria"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Cuenta Bancaria"
                helperText="Ej: 0102-1234-56789012345"
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProveedorForm;
