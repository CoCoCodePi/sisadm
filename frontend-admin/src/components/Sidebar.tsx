import { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Collapse,
} from "@mui/material";
import {
  Dashboard,
  Inventory,
  PointOfSale,
  Payment,
  Store,
  Receipt,
  Settings,
  Group,
  SupervisorAccount,
  ShoppingCart,
  AttachMoney,
  ExpandLess,
  ExpandMore,
  PriceChange,
  RequestQuote,
  CreditCard, // AÑADIDOS: Iconos para los nuevos módulos
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [configOpen, setConfigOpen] = useState(false);

  const menuGroups = [
    {
      title: "Principal",
      items: [
        {
          text: "Dashboard",
          icon: <Dashboard />,
          path: "/dashboard",
          rol: ["maestro", "admin", "vendedor"],
        },
        {
          text: "Punto de Venta (POS)",
          icon: <PointOfSale />,
          path: "/pos",
          rol: ["maestro", "admin", "vendedor"],
        },
      ],
    },
    {
      title: "Gestión",
      items: [
        {
          text: "Ventas",
          icon: <Receipt />,
          path: "/ventas",
          rol: ["maestro", "admin", "vendedor"],
        },
        {
          text: "Compras",
          icon: <ShoppingCart />,
          path: "/compras",
          rol: ["maestro", "admin", "operador"],
        },
        {
          text: "Inventario",
          icon: <Inventory />,
          path: "/inventario",
          rol: ["maestro", "admin"],
        },
        {
          text: "Productos",
          icon: <Store />,
          path: "/productos",
          rol: ["maestro", "admin", "operador"],
        },
        {
          text: "Proveedores",
          icon: <Store />,
          path: "/proveedores",
          rol: ["maestro", "admin", "operador"],
        },
        {
          text: "Clientes",
          icon: <Group />,
          path: "/clientes",
          rol: ["maestro", "admin", "vendedor"],
        },
        {
          text: "Cuentas por Pagar",
          icon: <AttachMoney />,
          path: "/cuentas-por-pagar",
          rol: ["maestro", "admin"],
        },
        // --- AÑADIDO: Módulo de Cuentas por Cobrar ---
        {
          text: "Cuentas por Cobrar",
          icon: <RequestQuote />,
          path: "/cuentas-por-cobrar",
          rol: ["maestro", "admin"],
        },
      ],
    },
    {
      title: "Administración",
      items: [
        {
          text: "Reportes",
          icon: <Payment />,
          path: "/reportes",
          rol: ["maestro", "admin"],
        },
        {
          text: "Usuarios",
          icon: <SupervisorAccount />,
          path: "/usuarios",
          rol: ["maestro"],
        },
      ],
    },
  ];

  const configMenuItems = [
    {
      text: "Tasa de Cambio",
      icon: <PriceChange />,
      path: "/configuracion/tasa-de-cambio",
      rol: ["maestro", "admin"],
    },
    // --- AÑADIDO: Módulo de Métodos de Pago ---
    {
      text: "Métodos de Pago",
      icon: <CreditCard />,
      path: "/configuracion/metodos-pago",
      rol: ["maestro", "admin"],
    },
  ];

  const isGroupVisible = (group: any) =>
    group.items.some((item: any) => item.rol.includes(user?.rol || ""));

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
      <List
        component="nav"
        sx={{ "& .MuiListSubheader-root": { bgcolor: "background.paper" } }}
      >
        {menuGroups.map(
          (group) =>
            isGroupVisible(group) && (
              <li key={`group-${group.title}`}>
                <ul>
                  <ListSubheader>{group.title}</ListSubheader>
                  {group.items
                    .filter((item) => item.rol.includes(user?.rol || ""))
                    .map((item) => (
                      <ListItem key={item.text} disablePadding>
                        <ListItemButton
                          component={Link}
                          to={item.path}
                          selected={location.pathname === item.path}
                        >
                          <ListItemIcon sx={{ color: "primary.main" }}>
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                              fontWeight:
                                location.pathname === item.path
                                  ? "bold"
                                  : "medium",
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                </ul>
              </li>
            )
        )}
        {["maestro", "admin"].includes(user?.rol || "") && (
          <li>
            <ul>
              <ListSubheader>Ajustes</ListSubheader>
              <ListItemButton onClick={() => setConfigOpen(!configOpen)}>
                <ListItemIcon sx={{ color: "primary.main" }}>
                  <Settings />
                </ListItemIcon>
                <ListItemText primary="Configuración" />
                {configOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              <Collapse in={configOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {configMenuItems
                    .filter((item) => item.rol.includes(user?.rol || ""))
                    .map((item) => (
                      <ListItemButton
                        key={item.text}
                        sx={{ pl: 4 }}
                        component={Link}
                        to={item.path}
                        selected={location.pathname === item.path}
                      >
                        <ListItemIcon sx={{ color: "secondary.main" }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontWeight:
                              location.pathname === item.path
                                ? "bold"
                                : "medium",
                          }}
                        />
                      </ListItemButton>
                    ))}
                </List>
              </Collapse>
            </ul>
          </li>
        )}
      </List>
    </Drawer>
  );
};

export default Sidebar;
