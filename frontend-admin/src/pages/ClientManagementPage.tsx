import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Alert,
  Tooltip,
  Button,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import ClientForm from "../components/ClientForm";
import { useSnackbar } from "notistack";
import apiClient from "../api/client";
import { Client } from "../types/cliente";

const ClientManagementPage = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const loadClients = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/clientes");
      setClients(data.data || []); // Asegurarse de que data es un array
      setError("");
    } catch (error) {
      setError("Error al cargar clientes");
      enqueueSnackbar("Error al cargar clientes", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: Partial<Client>) => {
    try {
      setFormLoading(true);
      if (selectedClient) {
        await apiClient.put(`/clientes/${selectedClient.id}`, values);
        enqueueSnackbar("Cliente actualizado", { variant: "success" });
      } else {
        await apiClient.post("/clientes", values);
        enqueueSnackbar("Cliente creado", { variant: "success" });
      }
      await loadClients();
      setOpenDialog(false);
    } catch (error) {
      enqueueSnackbar("Error al guardar cliente", { variant: "error" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/clientes/${id}`);
      setClients(clients.filter((c) => c.id !== id));
      enqueueSnackbar("Cliente eliminado", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Error al eliminar cliente", { variant: "error" });
    }
  };

  useEffect(() => {
    if (user?.rol && ["maestro", "admin"].includes(user.rol)) {
      loadClients();
    }
  }, [user]);

  if (!["maestro", "admin"].includes(user?.rol || "")) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No tienes permisos para acceder a esta sección
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: "0 auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Gestión de Clientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setSelectedClient(null);
            setOpenDialog(true);
          }}
        >
          Nuevo Cliente
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: "primary.main" }}>
                <TableRow>
                  {[
                    "Nombre",
                    "Tipo de Documento",
                    "Teléfono",
                    "Email",
                    "Acciones",
                  ].map((header) => (
                    <TableCell
                      key={header}
                      sx={{ color: "white", fontWeight: "bold" }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} hover>
                    <TableCell>{client.nombre}</TableCell>
                    <TableCell>
                      {`${client.tipo_documento}-${client.documento}`}
                    </TableCell>
                    <TableCell>{client.telefono}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>
                      <Tooltip title="Editar">
                        <IconButton
                          onClick={() => {
                            setSelectedClient(client);
                            setOpenDialog(true);
                          }}
                        >
                          <Edit color="primary" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton onClick={() => handleDelete(client.id)}>
                          <Delete color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog
            open={openDialog}
            onClose={() => setOpenDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              {selectedClient ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
            <DialogContent dividers>
              <ClientForm
                initialValues={selectedClient || undefined}
                onSubmit={handleSubmit}
                onCancel={() => setOpenDialog(false)}
                loading={formLoading}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default ClientManagementPage;
