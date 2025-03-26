import { useForm, Controller } from "react-hook-form";
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  MenuItem,
} from "@mui/material";
import { Client } from "../types/client";

type ClientFormProps = {
  initialValues?: Partial<Client>;
  onSubmit: (values: Partial<Client>) => void;
  onCancel: () => void;
  loading: boolean;
};

const documentTypes = ["J", "V", "E", "P"]; // Tipos de documentos

const ClientForm = ({
  initialValues,
  onSubmit,
  onCancel,
  loading,
}: ClientFormProps) => {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Partial<Client>>({
    defaultValues: initialValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box display="flex" flexDirection="column" gap={2}>
        <Controller
          name="nombre"
          control={control}
          rules={{ required: "Nombre es requerido" }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Nombre Completo"
              error={!!errors.nombre}
              helperText={errors.nombre?.message}
              fullWidth
            />
          )}
        />

        <Box display="flex" gap={2}>
          <Controller
            name="tipo_documento"
            control={control}
            rules={{ required: "Tipo de documento es requerido" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Tipo de Documento"
                select
                error={!!errors.tipo_documento}
                helperText={errors.tipo_documento?.message}
                fullWidth
              >
                {documentTypes.map((docType) => (
                  <MenuItem key={docType} value={docType}>
                    {docType}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="documento"
            control={control}
            rules={{
              required: "Número de documento es requerido",
              pattern: {
                value: /^[A-Za-z0-9-]+$/,
                message: "Formato de documento inválido",
              },
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
        </Box>

        <Controller
          name="email"
          control={control}
          rules={{
            required: "Email es requerido",
            pattern: {
              value: /^\S+@\S+$/i,
              message: "Email inválido",
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Email"
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
          rules={{
            required: "Teléfono es requerido",
            pattern: {
              value: /^\d{11}$/,
              message: "Debe tener 11 dígitos",
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Teléfono"
              error={!!errors.telefono}
              helperText={errors.telefono?.message}
              fullWidth
            />
          )}
        />

        <Controller
          name="direccion"
          control={control}
          rules={{ required: "Dirección es requerida" }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Dirección"
              multiline
              rows={3}
              error={!!errors.direccion}
              helperText={errors.direccion?.message}
              fullWidth
            />
          )}
        />

        <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
          <Button variant="outlined" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Guardar"}
          </Button>
        </Box>
      </Box>
    </form>
  );
};

export default ClientForm;
