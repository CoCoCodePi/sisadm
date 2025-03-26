import { useState, useEffect } from "react";
import {
  Grid,
  Box,
  Paper,
  Typography,
  useTheme,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import { BarChart, LineChart, PieChart } from "@mui/x-charts";
import apiClient from "../api/client";
import { DatePicker } from "@mui/x-date-pickers";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";

// Definir los tipos para los datos del dashboard
type SalesData = {
  today: number;
  week: number[];
  month: {
    categories: string[];
    data: number[];
  };
};

type InventoryData = {
  totalProducts: number;
  lowStock: {
    product: string;
    current: number;
    min: number;
  }[];
};

type ClientsData = {
  today: number;
  pendingPayments: number;
};

type DashboardData = {
  sales: SalesData;
  inventory: InventoryData;
  clients: ClientsData;
};

const DashboardPage = () => {
  const theme = useTheme();

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    sales: {
      today: 0,
      week: [],
      month: {
        categories: [],
        data: [],
      },
    },
    inventory: {
      totalProducts: 0,
      lowStock: [],
    },
    clients: {
      today: 0,
      pendingPayments: 0,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const salesResponse = await apiClient.get("/dashboard/sales");
        const inventoryResponse = await apiClient.get("/dashboard/inventory");
        const clientsResponse = await apiClient.get("/dashboard/clients");

        setDashboardData({
          sales: salesResponse.data,
          inventory: inventoryResponse.data,
          clients: clientsResponse.data,
        });
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      }
    };

    fetchData();
  }, []);

  return (
    <Box sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
      {/* Header con selector de fecha */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4" fontWeight="bold">
          Panel de Control - {new Date().toLocaleDateString()}
        </Typography>
        <DatePicker
          label="Seleccionar fecha"
          slotProps={{
            textField: {
              variant: "outlined",
              fullWidth: true,
            },
          }}
        />
      </Stack>

      {/* Tarjetas resumen */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "primary.light" }}>
            <AttachMoneyIcon fontSize="large" color="primary" />
            <Typography variant="h6" mt={1}>
              Ventas Hoy
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              ${dashboardData.sales.today.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "secondary.light" }}>
            <Inventory2Icon fontSize="large" color="secondary" />
            <Typography variant="h6" mt={1}>
              Productos en Stock
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {dashboardData.inventory.totalProducts}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "success.light" }}>
            <PeopleAltIcon fontSize="large" color="success" />
            <Typography variant="h6" mt={1}>
              Clientes Hoy
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {dashboardData.clients.today}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "warning.light" }}>
            <EventBusyIcon fontSize="large" color="warning" />
            <Typography variant="h6" mt={1}>
              Pagos Pendientes
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {dashboardData.clients.pendingPayments}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Gráficos principales */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" mb={2}>
              Tendencia de Ventas Semanal
            </Typography>
            <LineChart
              series={[
                {
                  data: dashboardData.sales.week,
                  label: "Ventas",
                  color: theme.palette.primary.main,
                },
              ]}
              xAxis={[
                {
                  scaleType: "point",
                  data: ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"],
                },
              ]}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" mb={2}>
              Ventas por Categoría (Mes)
            </Typography>
            <PieChart
              series={[
                {
                  data: dashboardData.sales.month.categories.map(
                    (category, index) => ({
                      value: dashboardData.sales.month.data[index],
                      label: category,
                      color: theme.palette.secondary.main,
                    })
                  ),
                },
              ]}
              width={400}
              height={300}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" mb={2}>
              Métodos de Pago (Últimos 7 días)
            </Typography>
            <BarChart
              series={[
                { data: [65, 25, 10], color: theme.palette.success.main },
              ]}
              xAxis={[
                {
                  scaleType: "band",
                  data: ["Efectivo", "Tarjeta", "Transferencia"],
                },
              ]}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" mb={2}>
              Alertas de Inventario
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Stock Actual</TableCell>
                    <TableCell align="right">Mínimo Requerido</TableCell>
                    <TableCell align="center">Urgencia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.inventory.lowStock.map((item) => (
                    <TableRow key={item.product}>
                      <TableCell>{item.product}</TableCell>
                      <TableCell align="right">{item.current}</TableCell>
                      <TableCell align="right">{item.min}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={
                            item.current < item.min / 2 ? "CRÍTICO" : "ALERTA"
                          }
                          color={
                            item.current < item.min / 2 ? "error" : "warning"
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Actividad Reciente */}
      <Paper sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6" mb={2}>
          Actividad Reciente
        </Typography>
        <List>
          {/* Ejemplo de datos de actividad reciente */}
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Venta realizada - #FAC-00123"
              secondary="15/05/2024 - Cliente: María González - Total: $120.000"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WarningIcon color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Stock actualizado - Kerastase Resistance"
              secondary="15/05/2024 - Nuevo stock: 8 unidades"
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default DashboardPage;
