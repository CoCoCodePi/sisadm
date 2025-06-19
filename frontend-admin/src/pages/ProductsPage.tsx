import React, { useState, useEffect, useCallback } from "react";
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
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  CircularProgress,
} from "@mui/material";
import {
  Add,
  Edit,
  Inventory,
  FileDownload,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Delete,
} from "@mui/icons-material";
import ProductForm from "../components/ProductForm";
import apiClient from "../api/client";
import { Producto } from "../types/producto";
import { useSnackbar } from "notistack";
import ConfirmationDialog from "../components/ConfirmationDialog";

const sanitizeCsvCell = (cellData: any): string => {
  const data = String(cellData ?? "");
  if (data.includes('"') || data.includes(",") || data.includes("\n")) {
    return `"${data.replace(/"/g, '""')}"`;
  }
  return data;
};

// --- AÑADIDO: Función de transformación reutilizable ---
const transformProductData = (p: any): Producto => ({
  ...p,
  marca: p.marca_id ? { id: p.marca_id, nombre: p.marca_nombre } : null,
  linea: p.linea_id ? { id: p.linea_id, nombre: p.linea_nombre } : null,
  categoria_principal: p.categoria_principal_id
    ? { id: p.categoria_principal_id, nombre: p.categoria_principal }
    : null,
  variantes: p.variantes || [],
  categorias_secundarias: p.categorias_secundarias || [],
  proveedores: p.proveedores || [],
  imagenes: p.imagenes || [],
});

const ExpandableTableRow = ({
  product,
  onEdit,
  onDelete,
}: {
  product: Producto;
  onEdit: (product: Producto) => void;
  onDelete: (productId: number) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }} hover>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          <Typography variant="body1" fontWeight="bold">
            {product.nombre}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {product.categoria_principal?.nombre || "Sin Categoría"}
          </Typography>
        </TableCell>
        <TableCell>{product.marca?.nombre || "Sin Marca"}</TableCell>
        <TableCell>{product.linea?.nombre || "Sin Línea"}</TableCell>
        <TableCell align="center">
          <Chip label={product.variantes.length} color="primary" size="small" />
        </TableCell>
        <TableCell>
          <Chip
            label={product.estado}
            color={product.estado === "activo" ? "success" : "default"}
            size="small"
          />
        </TableCell>
        <TableCell align="right">
          <Tooltip title="Editar Producto">
            <IconButton onClick={() => onEdit(product)}>
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar Producto">
            <IconButton onClick={() => onDelete(product.id)} color="error">
              <Delete />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Variantes
              </Typography>
              <Table size="small" aria-label="variantes">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre Variante</TableCell>
                    <TableCell>Contenido</TableCell>
                    <TableCell>Precio 1 (General)</TableCell>
                    <TableCell>Códigos de Barras</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {product.variantes.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell>{variant.nombre}</TableCell>
                      <TableCell>
                        {variant.cantidad} {product.unidad_medida_base}
                      </TableCell>
                      <TableCell>
                        ${(variant.precio_1 || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>{variant.codigos_barras.join(", ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

const ProductsPage = () => {
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data: apiResponse } = await apiClient.get("/productos");
      if (apiResponse.success && Array.isArray(apiResponse.data)) {
        // --- MODIFICADO: Usando la función de transformación ---
        const cleanData = apiResponse.data.map(transformProductData);
        setProducts(cleanData);
      } else {
        throw new Error("Respuesta de API no válida");
      }
    } catch (error) {
      console.error("Error cargando productos:", error);
      enqueueSnackbar("Error al cargar los productos", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const handleExportCSV = () => {
    if (products.length === 0) {
      enqueueSnackbar("No hay productos para exportar", { variant: "info" });
      return;
    }

    const headers = [
      "ID Producto",
      "Nombre Producto",
      "Categoría Principal",
      "Marca",
      "Línea",
      "Unidad de Medida",
      "Estado",
      "ID Variante",
      "Nombre Variante",
      "Contenido",
      "Precio 1",
      "Precio 2",
      "Precio 3",
      "Precio 4",
      "Costo Base Venta",
      "Códigos de Barras",
    ];
    const rows = products.flatMap((p) =>
      p.variantes.map((v) => [
        p.id,
        p.nombre,
        p.categoria_principal?.nombre || "",
        p.marca?.nombre || "",
        p.linea?.nombre || "",
        p.unidad_medida_base,
        p.estado,
        v.id,
        v.nombre,
        v.cantidad,
        v.precio_1,
        v.precio_2,
        v.precio_3,
        v.precio_4,
        v.costo_base_venta || 0,
        v.codigos_barras.join("; "),
      ])
    );
    const csvContent = [
      headers.map(sanitizeCsvCell).join(","),
      ...rows.map((row) => row.map(sanitizeCsvCell).join(",")),
    ].join("\n");
    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `productos_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleEdit = (product: Producto) => {
    setSelectedProduct(product);
    setOpenForm(true);
  };

  const handleAddNew = () => {
    setSelectedProduct(null);
    setOpenForm(true);
  };

  const handleDeleteClick = (productId: number) => {
    setProductToDelete(productId);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await apiClient.delete(`/productos/${productToDelete}`);
      enqueueSnackbar("Producto eliminado con éxito", { variant: "success" });
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete));
    } catch (error: any) {
      enqueueSnackbar(
        error.response?.data?.message || "Error al eliminar el producto",
        { variant: "error" }
      );
    } finally {
      setOpenDeleteDialog(false);
      setProductToDelete(null);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // --- MODIFICADO: La lógica de `handleCloseForm` ahora usa la transformación ---
  const handleCloseForm = (rawUpdatedProduct?: any) => {
    setOpenForm(false);
    setSelectedProduct(null);
    if (rawUpdatedProduct) {
      const updatedProduct = transformProductData(rawUpdatedProduct);
      setProducts((prevProducts) => {
        const index = prevProducts.findIndex((p) => p.id === updatedProduct.id);
        if (index !== -1) {
          const newProducts = [...prevProducts];
          newProducts[index] = updatedProduct;
          return newProducts;
        } else {
          return [updatedProduct, ...prevProducts];
        }
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">
          <Inventory sx={{ mr: 1, verticalAlign: "middle" }} />
          Gestión de Productos
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={handleExportCSV}
            disabled={products.length === 0}
            sx={{ mr: 1 }}
          >
            Exportar CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddNew}
          >
            Nuevo Producto
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table aria-label="collapsible table">
            <TableHead>
              <TableRow sx={{ bgcolor: "primary.light" }}>
                <TableCell />
                <TableCell>Nombre del Producto / Cat. Principal</TableCell>
                <TableCell>Marca</TableCell>
                <TableCell>Línea</TableCell>
                <TableCell align="center">Nº de Variantes</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <ExpandableTableRow
                  key={product.id}
                  product={product}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {openForm && (
        <ProductForm
          open={openForm}
          onClose={handleCloseForm}
          product={selectedProduct}
        />
      )}

      <ConfirmationDialog
        open={openDeleteDialog}
        title="Confirmar Eliminación"
        content="¿Está seguro de eliminar este producto? Esta acción no se puede deshacer."
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
      />
    </Box>
  );
};

export default ProductsPage;
