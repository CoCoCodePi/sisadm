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
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import UserForm from "../components/UserForm";
import { useSnackbar } from "notistack";
import apiClient from "../api/client";
import { User } from "../types/user";

const UserManagementPage = () => {
  const { user, deleteUser, updateUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/auth/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(data);
      setError("");
    } catch (error) {
      setError("Error al cargar usuarios");
      enqueueSnackbar("Error al cargar usuarios", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: Partial<User>) => {
    try {
      if (userData.rol === "maestro" && user?.rol !== "maestro") {
        throw new Error("Solo un maestro puede crear usuarios maestros");
      }

      await apiClient.post("/auth/register", userData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      await loadUsers();
      enqueueSnackbar("Usuario creado exitosamente", { variant: "success" });
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      enqueueSnackbar(message, { variant: "error" });
    }
  };

  const handleUpdateUser = async (values: Partial<User>) => {
    try {
      if (!selectedUser) return;

      const { password, ...restValues } = values;
      const updateData = password ? values : restValues;

      await updateUser(selectedUser.email, updateData);
      await loadUsers();
      setOpenDialog(false);
      enqueueSnackbar("Usuario actualizado", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Error al actualizar usuario", { variant: "error" });
    }
  };

  const handleDelete = async (email: string) => {
    try {
      await deleteUser(email);
      setUsers(users.filter((u) => u.email !== email));
      enqueueSnackbar("Usuario eliminado", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Error al eliminar usuario", { variant: "error" });
    }
  };

  useEffect(() => {
    if (user?.rol === "maestro") loadUsers();
  }, [user]);

  if (user?.rol !== "maestro") {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mt: 2 }}>
          Acceso denegado - Requiere rol de Maestro
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: "0 auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Gestión de Usuarios
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setSelectedUser(null);
            setOpenDialog(true);
          }}
        >
          Nuevo Usuario
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
                  {["Nombre", "Email", "Rol", "Acciones"].map((header) => (
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
                {users.map((user) => (
                  <TableRow key={user.email} hover>
                    <TableCell>{user.nombre}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.rol}</TableCell>
                    <TableCell>
                      <Tooltip title="Editar">
                        <IconButton
                          onClick={() => {
                            setSelectedUser(user);
                            setOpenDialog(true);
                          }}
                        >
                          <Edit color="primary" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton onClick={() => handleDelete(user.email)}>
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
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {selectedUser ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
            <DialogContent dividers>
              <UserForm
                initialValues={selectedUser || undefined}
                onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default UserManagementPage;
