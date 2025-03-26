// src/pages/LoginPage.tsx
import { useForm } from "react-hook-form";
import {
  Button,
  TextField,
  Container,
  Typography,
  Box,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useSnackbar } from "notistack";

type FormData = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const { login } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      enqueueSnackbar('Bienvenido', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Credenciales incorrectas', { variant: 'error' });
    }
  };

  return (
    <Container
      maxWidth="xs"
      sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}
    >
      <Box sx={{ width: "100%", textAlign: "center" }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ mb: 4, color: "primary.main" }}
        >
          CosmeticOS
        </Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Email"
            margin="normal"
            {...register("email", {
              required: "Campo requerido",
              pattern: { value: /^\S+@\S+$/i, message: "Email inválido" },
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            margin="normal"
            {...register("password", { required: "Campo requerido" })}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            Ingresar al Sistema
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
