import {
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
} from "@mui/material";
import {
  Assessment,
  PointOfSale,
  Inventory,
  Group,
  TrendingUp,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const ReportesPage = () => {
  const navigate = useNavigate();

  const reportesDisponibles = [
    {
      title: "Reporte de Ventas",
      icon: <PointOfSale sx={{ fontSize: 40 }} color="primary" />,
      path: "/reportes/ventas",
      description:
        "Analiza las ventas por rango de fechas, clientes o vendedores.",
    },
    {
      title: "Reporte de Inventario",
      icon: <Inventory sx={{ fontSize: 40 }} color="primary" />,
      path: "/reportes/inventario",
      description:
        "Consulta el valor del inventario, productos de baja rotación y más.",
      disabled: false,
    },
    {
      title: "Productos Más Vendidos",
      icon: <TrendingUp sx={{ fontSize: 40 }} color="primary" />,
      path: "/reportes/mas-vendidos",
      description: "Identifica tus productos estrella por unidades vendidas.",
    },
    {
      title: "Reporte de Clientes",
      icon: <Group sx={{ fontSize: 40 }} color="primary" />,
      path: "#",
      description:
        "Próximamente: Analiza el comportamiento de compra de tus clientes.",
      disabled: true,
    },
  ];

  return (
    <Box p={3}>
      <Typography
        variant="h4"
        sx={{ mb: 3, display: "flex", alignItems: "center" }}
      >
        <Assessment sx={{ mr: 1 }} />
        Módulo de Reportes
      </Typography>
      <Grid container spacing={3}>
        {reportesDisponibles.map((reporte) => (
          <Grid item xs={12} md={4} key={reporte.title}>
            <Card sx={{ height: "100%", opacity: reporte.disabled ? 0.6 : 1 }}>
              <CardActionArea
                sx={{
                  p: 2,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
                onClick={() => !reporte.disabled && navigate(reporte.path)}
                disabled={reporte.disabled}
              >
                {reporte.icon}
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {reporte.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {reporte.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ReportesPage;
