// src/pages/CashRegisterPage.tsx
import { Box, Typography, Paper, Button } from "@mui/material";

const CashRegisterPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Módulo de Caja Registradora
      </Typography>
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          Funcionalidad en desarrollo
        </Typography>
        <Button variant="contained" color="primary">
          Iniciar Jornada
        </Button>
      </Paper>
    </Box>
  );
};

export default CashRegisterPage;
