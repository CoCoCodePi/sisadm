import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  TextField,
  Button,
  Box,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import apiClient from "../api/client";
import { User } from "../types/user";
import { useAuth } from "../contexts/AuthContext"; // Importa el contexto de autenticación

type UserFormProps = {
  initialValues?: Partial<User>;
  onSubmit: (values: Partial<User>) => void;
};

const roles = ["maestro", "admin", "vendedor"];

const UserForm = ({ initialValues, onSubmit }: UserFormProps) => {
  const { handleSubmit, control, setError, clearErrors } = useForm<
    Partial<User>
  >({
    defaultValues: initialValues,
  });
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const { user } = useAuth(); // Obtén la información del usuario autenticado

  const validateEmail = async (email: string) => {
    if (initialValues && initialValues.email === email) {
      // No validar si el email no ha cambiado
      return;
    }
    try {
      const { data } = await apiClient.get(`/auth/check-email?email=${email}`);
      if (data.message === "El email ya está registrado") {
        setError("email", { type: "manual", message: data.message });
        setEmailError(data.message);
      } else {
        clearErrors("email");
        setEmailError(null);
      }
    } catch (error) {
      setError("email", {
        type: "manual",
        message: "Error al verificar email",
      });
      setEmailError("Error al verificar email");
    }
  };

  useEffect(() => {
    if (initialValues?.email) {
      validateEmail(initialValues.email);
    }
  }, [initialValues?.email]);

  const validateRol = (value?: "maestro" | "admin" | "vendedor") => {
    if (!value) return "El rol es requerido";

    if (initialValues?.rol === "maestro" && value !== "maestro") {
      if (user?.rol !== "maestro") {
        return "Solo un maestro puede modificar roles de maestro";
      }
    }

    if (value === "maestro" && user?.rol !== "maestro") {
      return "Solo un maestro puede asignar este rol";
    }

    return true;
  };

  const onSubmitHandler = async (values: Partial<User>) => {
    setLoading(true);
    await onSubmit(values);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} id="user-form">
      <Box display="flex" flexDirection="column" gap={2}>
        <Controller
          name="nombre"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Nombre" required fullWidth />
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Email"
              type="email"
              required
              fullWidth
              error={!!emailError}
              helperText={emailError}
              onChange={(e) => {
                field.onChange(e);
                validateEmail(e.target.value);
              }}
            />
          )}
        />

        <Controller
          name="rol"
          control={control}
          rules={{
            required: "Campo requerido",
            validate: validateRol,
          }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Rol"
              select
              required
              fullWidth
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            >
              {roles.map((rol) => (
                <MenuItem
                  key={rol}
                  value={rol}
                  disabled={
                    rol === "maestro" &&
                    user?.rol !== "maestro" &&
                    initialValues?.rol !== "maestro"
                  }
                >
                  {rol}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Contraseña"
              type="password"
              fullWidth
              required={!initialValues}
            />
          )}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Guardar"}
        </Button>
      </Box>
    </form>
  );
};

export default UserForm;
