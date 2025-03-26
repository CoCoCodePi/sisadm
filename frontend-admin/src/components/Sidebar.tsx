// src/components/Sidebar.tsx
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Dashboard,
  People,
  Inventory,
  PointOfSale,
  Payment,
  Store,
  Receipt,
  Settings,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

const Sidebar = () => {
  const { user } = useAuth();

  const menuItems = [
    {
      text: "Dashboard",
      icon: <Dashboard />,
      path: "/dashboard",
      rol: ["maestro", "admin", "vendedor"],
    },
    {
      text: "Caja",
      icon: <PointOfSale />,
      path: "/caja",
      rol: ["maestro", "admin", "vendedor"],
    },
    {
      text: "Ventas",
      icon: <Receipt />,
      path: "/ventas",
      rol: ["maestro", "admin", "vendedor"],
    },
    {
      text: "Clientes",
      icon: <People />,
      path: "/clientes",
      rol: ["maestro", "admin"],
    },
    {
      text: "Productos",
      icon: <Inventory />,
      path: "/productos",
      rol: ["maestro", "admin"],
    },
    {
      text: "Proveedores",
      icon: <Store />,
      path: "/proveedores",
      rol: ["maestro", "admin"],
    },
    {
      text: "Usuarios",
      icon: <People />,
      path: "/usuarios",
      rol: ["maestro"],
    },
    {
      text: "Reportes",
      icon: <Payment />,
      path: "/reportes",
      rol: ["maestro", "admin"],
    },
    {
      text: "Configuración",
      icon: <Settings />,
      path: "/configuracion",
      rol: ["maestro"],
    },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 240,
          boxSizing: "border-box",
          bgcolor: "background.paper",
        },
      }}
    >
      <List>
        {menuItems
          .filter((item) => item.rol.includes(user?.rol || "vendedor"))
          .map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton component={Link} to={item.path}>
                <ListItemIcon sx={{ color: "primary.main" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontWeight: "medium" }}
                />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
