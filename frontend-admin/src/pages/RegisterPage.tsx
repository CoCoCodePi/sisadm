// src/pages/RegisterPage.tsx
import { useForm } from "react-hook-form";
import {
  Button,
  TextField,
  Container,
  Typography,
  Box,
  MenuItem,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

type FormData = {
  email: string;
  password: string;
  confirmPassword: string;
  nombre: string;
  rol?: "maestro" | "admin" | "vendedor";
};

const RegisterPage = () => {
  const { user, registerUser } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    await registerUser({
      email: data.email,
      password: data.password,
      nombre: data.nombre,
      rol: data.rol || "vendedor", // Default para no-maestros
    });
    navigate("/users");
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, p: 4, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Registrar Nuevo Usuario
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            label="Nombre Completo"
            margin="normal"
            {...register("nombre", { required: "Campo requerido" })}
            error={!!errors.nombre}
            helperText={errors.nombre?.message}
          />

          <TextField
            fullWidth
            label="Email"
            type="email"
            margin="normal"
            {...register("email", {
              required: "Campo requerido",
              pattern: { value: /^\S+@\S+$/i, message: "Email inválido" },
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          {user?.rol === "maestro" && (
            <TextField
              fullWidth
              select
              label="Rol"
              margin="normal"
              defaultValue="vendedor"
              {...register("rol")}
            >
              <MenuItem value="vendedor">Vendedor</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
              <MenuItem value="maestro">Maestro</MenuItem>
            </TextField>
          )}

          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            margin="normal"
            {...register("password", {
              required: "Campo requerido",
              minLength: { value: 8, message: "Mínimo 8 caracteres" },
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <TextField
            fullWidth
            label="Confirmar Contraseña"
            type="password"
            margin="normal"
            {...register("confirmPassword", {
              validate: (value) =>
                value === watch("password") || "Las contraseñas no coinciden",
            })}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />

          <Button type="submit" variant="contained" sx={{ mt: 3 }} fullWidth>
            Registrar Usuario
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default RegisterPage;
