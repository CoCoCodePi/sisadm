import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import MarcaForm from "../components/MarcaForm";
import apiClient from "../api/client";
import { useSnackbar } from "notistack";

const MarcasPage = () => {
  const [marcas, setMarcas] = useState<any[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const loadMarcas = async () => {
    try {
      const { data } = await apiClient.get("/marcas");
      setMarcas(data.data);
    } catch (error) {
      enqueueSnackbar("Error cargando marcas", { variant: "error" });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Gestión de Marcas
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenForm(true)}
        >
          Nueva Marca
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Logo</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Banners</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {marcas.map((marca) => (
              <TableRow key={marca.id}>
                <TableCell>
                  <Avatar src={marca.logo_url} variant="rounded" />
                </TableCell>
                <TableCell>{marca.nombre}</TableCell>
                <TableCell>
                  {marca.banners?.filter((b: any) => b.activo).length || 0}
                </TableCell>
                <TableCell>
                  <IconButton>
                    <Edit color="primary" />
                  </IconButton>
                  <IconButton>
                    <Delete color="error" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <MarcaForm
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          loadMarcas();
        }}
      />
    </Box>
  );
};

export default MarcasPage;
