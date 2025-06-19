import { useForm, Controller } from "react-hook-form";
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Divider, // <-- AÑADIDO: Importar Divider
  InputAdornment, // <-- AÑADIDO: Importar InputAdornment
} from "@mui/material";
import { Cliente } from "../types/cliente";
import { useEffect } from "react"; // 'useState' no es necesario aquí y ha sido removido de la importación para evitar la advertencia de 'value is never read'.

type ClientFormProps = {
  initialValues?: Partial<Cliente>;
  onSubmit: (values: Partial<Cliente>) => void;
  onCancel: () => void;
  loading: boolean;
};

const documentTypes = ["V", "J", "E", "G", "P"];

const ClientForm = ({
  initialValues,
  onSubmit,
  onCancel,
  loading,
}: ClientFormProps) => {
  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Partial<Cliente>>({
    defaultValues: initialValues || {
      nombre: "",
      tipo_documento: "V",
      documento: "",
      email: "",
      telefono: "",
      direccion: "",
      // Asegurarse de que estas propiedades estén en Cliente interface
      permite_credito: false,
      limite_credito: 0,
    },
  });

  // AÑADIDO: Estado local para manejar la visibilidad del límite de crédito
  // 'watch' ya provee un valor reactivo, no necesitas un useState adicional para esto.
  const permiteCredito = watch("permite_credito");

  useEffect(() => {
    if (initialValues) {
      // Sincronizar el estado del formulario si hay valores iniciales
      // Asegurarse de que initialValues.permite_credito sea booleano
      setValue("permite_credito", !!initialValues.permite_credito);
      // Asegurarse de que initialValues.limite_credito sea un número
      setValue(
        "limite_credito",
        initialValues.limite_credito !== undefined &&
          initialValues.limite_credito !== null
          ? initialValues.limite_credito
          : 0
      );
    }
  }, [initialValues, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} id="client-form">
      <Box display="flex" flexDirection="column" gap={2} mt={1}>
        <Controller
          name="nombre"
          control={control}
          rules={{ required: "Nombre es requerido" }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Nombre Completo o Razón Social"
              error={!!errors.nombre}
              helperText={errors.nombre?.message}
              fullWidth
              autoFocus
            />
          )}
        />

        <Grid container spacing={2}>
          <Grid item xs={4} sm={3}>
            <Controller
              name="tipo_documento"
              control={control}
              rules={{ required: "Tipo es requerido" }}
              render={({ field }) => (
                <TextField {...field} label="Tipo" select fullWidth>
                  {documentTypes.map((docType) => (
                    <MenuItem key={docType} value={docType}>
                      {docType}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid item xs={8} sm={9}>
            <Controller
              name="documento"
              control={control}
              rules={{
                required: "Número de documento es requerido",
                pattern: { value: /^[0-9]+$/, message: "Solo números" },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Número de Documento"
                  error={!!errors.documento}
                  helperText={errors.documento?.message}
                  fullWidth
                />
              )}
            />
          </Grid>
        </Grid>

        <Controller
          name="email"
          control={control}
          rules={{
            pattern: { value: /^\S+@\S+$/i, message: "Email inválido" },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Email (Opcional)"
              type="email"
              error={!!errors.email}
              helperText={errors.email?.message}
              fullWidth
            />
          )}
        />

        <Controller
          name="telefono"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Teléfono (Opcional)" fullWidth />
          )}
        />

        <Controller
          name="direccion"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Dirección (Opcional)"
              multiline
              rows={2}
              fullWidth
            />
          )}
        />

        <Divider sx={{ my: 1 }} />

        {/* --- AÑADIDO: Campos para gestión de crédito --- */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <Controller
              name="permite_credito"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value as boolean} // Asegurarse de que el valor sea booleano
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label="Permitir Crédito a Cliente"
                />
              )}
            />
          </Grid>
          {/* Solo renderizar el campo limite_credito si permiteCredito es true */}
          {permiteCredito && (
            <Grid item xs={12} sm={7}>
              <Controller
                name="limite_credito"
                control={control}
                rules={{
                  // La validación solo aplica si permiteCredito es true
                  validate: (value) => {
                    if (
                      permiteCredito &&
                      (value === null ||
                        value === undefined ||
                        Number(value) <= 0)
                    ) {
                      return "Si el crédito está permitido, el límite debe ser mayor a 0";
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Límite de Crédito ($)"
                    type="number"
                    fullWidth
                    error={!!errors.limite_credito}
                    helperText={errors.limite_credito?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                      inputProps: { min: 0 }, // Asegurar que el input sea al menos 0
                    }}
                    onChange={(e) => field.onChange(Number(e.target.value))} // Convertir a número
                  />
                )}
              />
            </Grid>
          )}
        </Grid>

        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <Button variant="outlined" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            form="client-form"
          >
            {loading ? <CircularProgress size={24} /> : "Guardar"}
          </Button>
        </Box>
      </Box>
    </form>
  );
};

export default ClientForm;
