// src/components/Header.tsx
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Button,
  Chip,
} from "@mui/material";
import { Logout, PointOfSale } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react"; // Importa useState
import apiClient from "../api/client";
import { useSnackbar } from "notistack"; // Importa useSnackbar

const Header = () => {
  const { user, logout } = useAuth();
  const [cashRegisterStatus, setCashRegisterStatus] = useState("cerrada");
  const { enqueueSnackbar } = useSnackbar();

  const handleOpenCashRegister = async () => {
    try {
      const response = await apiClient.post(
        "/api/caja/abrir",
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setCashRegisterStatus("abierta");
      enqueueSnackbar(response.data.message, { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Error al abrir caja", { variant: "error" });
    }
  };

  return (
    <AppBar
      position="static"
      sx={{ bgcolor: "background.paper", boxShadow: 1 }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6" color="text.primary">
          CosmeticOS
        </Typography>

        <Box display="flex" alignItems="center" gap={3}>
          {["maestro", "admin"].includes(user?.rol || "") && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PointOfSale />}
              onClick={handleOpenCashRegister}
              sx={{ mr: 2 }}
            >
              Abrir Caja
            </Button>
          )}
          <Chip
            label={`Caja: ${cashRegisterStatus}`}
            color={cashRegisterStatus === "abierta" ? "success" : "error"}
            variant="outlined"
          />
          <Avatar sx={{ bgcolor: "primary.main" }}>
            {user?.email[0].toUpperCase()}
          </Avatar>

          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Typography variant="body2" color="text.primary">
              {user?.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Rol: {user?.rol}
            </Typography>
          </Box>

          <IconButton onClick={logout} color="inherit">
            <Logout sx={{ color: "error.main" }} />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
