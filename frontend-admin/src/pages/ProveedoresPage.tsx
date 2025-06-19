import { useState, useEffect, useCallback } from "react";
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
  TextField,
  Stack,
  Pagination,
  CircularProgress,
  Alert,
  Tooltip,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import ProveedorForm from "../components/ProveedorForm";
import { Proveedor, ProveedorFormData } from "../types/proveedor";
import { useSnackbar } from "notistack";
import ConfirmationDialog from "../components/ConfirmationDialog";
import apiClient from "../api/client";
import { debounce } from "lodash";

const ProveedoresPage = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(
    null
  );

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const loadProveedores = useCallback(
    debounce(async (currentPage: number, currentSearch: string) => {
      setLoading(true);
      try {
        const response = await apiClient.get("/proveedores", {
          params: {
            page: currentPage,
            limit: pagination.limit,
            search: currentSearch,
          },
        });

        if (response.data.success) {
          setProveedores(response.data.data || []);
          setPagination((prev) => ({
            ...prev,
            total: response.data.total || 0,
          }));
        } else {
          throw new Error(
            response.data.message || "Error en la respuesta de la API"
          );
        }
      } catch (error) {
        console.error("Error cargando proveedores:", error);
        enqueueSnackbar("Error cargando proveedores", { variant: "error" });
      } finally {
        setLoading(false);
      }
    }, 300),
    [pagination.limit]
  );

  useEffect(() => {
    loadProveedores(pagination.page, search);
  }, [search, pagination.page, loadProveedores]);

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedProveedor(null);
  };

  const handleSubmit = async (formData: ProveedorFormData) => {
    const submitData = {
      ...formData,
      rif: `J-${formData.rif_suffix}`,
    };

    try {
      if (selectedProveedor) {
        await apiClient.put(`/proveedores/${selectedProveedor.id}`, submitData);
        enqueueSnackbar("Proveedor actualizado con éxito", {
          variant: "success",
        });
      } else {
        await apiClient.post("/proveedores", submitData);
        enqueueSnackbar("Proveedor creado con éxito", { variant: "success" });
      }
      handleDialogClose();
      if (!selectedProveedor) {
        setPagination((prev) => ({ ...prev, page: 1 }));
      }
      loadProveedores(selectedProveedor ? pagination.page : 1, search);
    } catch (error: any) {
      enqueueSnackbar(
        error.response?.data?.message || "Error al guardar el proveedor",
        { variant: "error" }
      );
    }
  };

  const handleDelete = async () => {
    if (!selectedProveedor) return;
    try {
      await apiClient.delete(`/proveedores/${selectedProveedor.id}`);
      enqueueSnackbar("Proveedor eliminado", { variant: "success" });
      loadProveedores(pagination.page, search);
    } catch (error: any) {
      enqueueSnackbar(
        error.response?.data?.message || "Error eliminando proveedor",
        { variant: "error" }
      );
    } finally {
      setOpenDeleteDialog(false);
      setSelectedProveedor(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" mb={3} gap={2}>
        <Typography variant="h4">Proveedores</Typography>
        {["admin", "maestro"].includes(user?.rol || "") && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setSelectedProveedor(null);
              setOpenDialog(true);
            }}
          >
            Nuevo Proveedor
          </Button>
        )}
      </Stack>

      <TextField
        label="Buscar por Nombre o RIF"
        variant="outlined"
        fullWidth
        sx={{ mb: 3 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{ endAdornment: loading && <CircularProgress size={20} /> }}
      />

      {proveedores.length === 0 && !loading ? (
        <Alert severity="info">No se encontraron proveedores</Alert>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>RIF</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Contacto</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Días Crédito</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proveedores.map((proveedor) => (
                  <TableRow key={proveedor.id} hover>
                    <TableCell>{proveedor.rif}</TableCell>
                    <TableCell>{proveedor.nombre}</TableCell>
                    <TableCell>{proveedor.contacto_nombre}</TableCell>
                    <TableCell>{proveedor.telefono}</TableCell>
                    <TableCell>{proveedor.dias_credito}</TableCell>
                    <TableCell>
                      {/* CORRECCIÓN: Se envuelve el botón de Editar en un span */}
                      <Tooltip title="Editar">
                        <span>
                          <IconButton
                            onClick={() => {
                              setSelectedProveedor(proveedor);
                              setOpenDialog(true);
                            }}
                            disabled={
                              !["admin", "maestro"].includes(user?.rol || "")
                            }
                          >
                            <Edit />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <span>
                          <IconButton
                            onClick={() => {
                              setSelectedProveedor(proveedor);
                              setOpenDeleteDialog(true);
                            }}
                            disabled={
                              !["admin", "maestro"].includes(user?.rol || "")
                            }
                          >
                            <Delete color="error" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box display="flex" justifyContent="center">
            <Pagination
              count={Math.ceil(pagination.total / pagination.limit)}
              page={pagination.page}
              onChange={(_, page) =>
                setPagination((prev) => ({ ...prev, page }))
              }
              color="primary"
            />
          </Box>
        </>
      )}

      <Dialog
        fullWidth
        maxWidth="md"
        open={openDialog}
        onClose={handleDialogClose}
      >
        <DialogTitle>
          {selectedProveedor ? "Editar Proveedor" : "Nuevo Proveedor"}
        </DialogTitle>
        <DialogContent>
          <ProveedorForm
            onSubmit={handleSubmit}
            initialValues={selectedProveedor}
            isEditing={!!selectedProveedor}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancelar</Button>
          <Button type="submit" form="proveedor-form" variant="contained">
            {selectedProveedor ? "Guardar Cambios" : "Crear Proveedor"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={openDeleteDialog}
        title="Confirmar Eliminación"
        content="¿Está seguro de que desea eliminar este proveedor? Esta acción no se puede deshacer."
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleDelete}
      />
    </Box>
  );
};

export default ProveedoresPage;
