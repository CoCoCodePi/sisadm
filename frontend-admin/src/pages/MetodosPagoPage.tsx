import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { Edit, Delete, Add, CreditCard } from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useSnackbar } from "notistack";
import apiClient from "../api/client";
import ConfirmationDialog from "../components/ConfirmationDialog";

const MetodosPagoPage = () => {
  const [metodos, setMetodos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const fetchMetodos = () => {
    apiClient.get("/metodos-pago").then((res) => setMetodos(res.data.data));
  };

  useEffect(() => {
    fetchMetodos();
  }, []);

  const formik = useFormik({
    initialValues: { nombre: "", requiere_referencia: false, habilitado: true },
    validationSchema: Yup.object({
      nombre: Yup.string().required("El nombre es requerido."),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          ...values,
          requiere_referencia: !!values.requiere_referencia,
          habilitado: !!values.habilitado,
        };
        if (isEditing) {
          await apiClient.put(`/metodos-pago/${currentId}`, payload);
          enqueueSnackbar("Método de pago actualizado", { variant: "success" });
        } else {
          await apiClient.post("/metodos-pago", payload);
          enqueueSnackbar("Método de pago creado", { variant: "success" });
        }
        handleClose();
        fetchMetodos();
      } catch (error) {
        enqueueSnackbar("Error al guardar el método de pago", {
          variant: "error",
        });
      }
    },
  });

  const handleOpen = (metodo: any = null) => {
    if (metodo) {
      setIsEditing(true);
      setCurrentId(metodo.id);
      formik.setValues({
        nombre: metodo.nombre,
        requiere_referencia: !!metodo.requiere_referencia,
        habilitado: !!metodo.habilitado,
      });
    } else {
      setIsEditing(false);
      formik.resetForm();
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleDelete = (id: number) => {
    setCurrentId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentId) return;
    try {
      await apiClient.delete(`/metodos-pago/${currentId}`);
      enqueueSnackbar("Método de pago eliminado", { variant: "success" });
      fetchMetodos();
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || "Error al eliminar", {
        variant: "error",
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  return (
    <Box p={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h4" gutterBottom>
          <CreditCard sx={{ mr: 1 }} />
          Gestión de Métodos de Pago
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Añadir Método
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>¿Requiere Referencia?</TableCell>
              <TableCell>Habilitado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {metodos.map((metodo) => (
              <TableRow key={metodo.id} hover>
                <TableCell>{metodo.nombre}</TableCell>
                <TableCell>
                  {metodo.requiere_referencia ? "Sí" : "No"}
                </TableCell>
                <TableCell>{metodo.habilitado ? "Sí" : "No"}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpen(metodo)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(metodo.id)}>
                    <Delete color="error" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle>
            {isEditing ? "Editar" : "Nuevo"} Método de Pago
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              autoFocus
              margin="dense"
              id="nombre"
              name="nombre"
              label="Nombre"
              value={formik.values.nombre}
              onChange={formik.handleChange}
              error={formik.touched.nombre && Boolean(formik.errors.nombre)}
              helperText={formik.touched.nombre && formik.errors.nombre}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.requiere_referencia}
                  onChange={formik.handleChange}
                  name="requiere_referencia"
                />
              }
              label="Requiere Número de Referencia"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.habilitado}
                  onChange={formik.handleChange}
                  name="habilitado"
                />
              }
              label="Habilitado para la Venta"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancelar</Button>
            <Button type="submit" variant="contained">
              Guardar
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmar Eliminación"
        content="¿Está seguro de que desea eliminar este método de pago?"
      />
    </Box>
  );
};

export default MetodosPagoPage;
