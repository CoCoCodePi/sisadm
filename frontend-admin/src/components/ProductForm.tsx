import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  IconButton,
  CircularProgress,
  Autocomplete,
  Chip,
  Typography,
  Paper,
  Stack,
  Tooltip,
  InputAdornment,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Close,
  AddCircleOutline,
  Delete,
  ContentCopy,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import apiClient from "../api/client";
import {
  Producto,
  Variante,
  Categoria,
  Marca,
  Linea,
  UnidadMedida,
} from "../types/producto";
import { Proveedor } from "../types/proveedor";

interface ProductFormProps {
  open: boolean;
  onClose: (updatedProduct?: Producto) => void;
  product?: Producto | null;
  initialBarcode?: string;
}

const getInitialFormData = (): Omit<Producto, "id"> & { id?: number } => ({
  nombre: "",
  descripcion: "",
  estado: "activo",
  unidad_medida_base: "",
  marca: null,
  linea: null,
  categoria_principal: null,
  categorias_secundarias: [],
  proveedores: [],
  variantes: [],
  imagenes: [],
});

const ProductForm: React.FC<ProductFormProps> = ({
  open,
  onClose,
  product,
  initialBarcode,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState(getInitialFormData());
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [allProveedores, setAllProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!open) return;
      setLoading(true);
      try {
        const [marcasRes, catsRes, unidadesRes, provRes] = await Promise.all([
          apiClient.get("/marcas"),
          apiClient.get("/categorias"),
          apiClient.get("/unidades-medida"),
          apiClient.get("/proveedores?limit=1000"),
        ]);
        setMarcas(marcasRes.data?.data || []);
        setCategorias(catsRes.data?.data || []);
        setUnidades(unidadesRes.data?.data || []);
        setAllProveedores(provRes.data?.data || []);
      } catch (error) {
        console.error("Error cargando datos para el formulario:", error);
        enqueueSnackbar("Error cargando datos para el formulario", {
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [open, enqueueSnackbar]);

  useEffect(() => {
    const fetchLineas = async () => {
      const marcaId = formData.marca?.id;
      if (marcaId) {
        try {
          const res = await apiClient.get(`/marcas/${marcaId}/lineas`);
          setLineas(res.data?.data || []);
        } catch (error) {
          console.error("Error cargando líneas de producto", error);
          setLineas([]);
        }
      } else {
        setLineas([]);
      }
    };
    if (formData.marca) {
      fetchLineas();
    }
  }, [formData.marca]);

  useEffect(() => {
    if (open) {
      if (product) {
        setFormData({ ...getInitialFormData(), ...product });
      } else {
        const initialFormState = getInitialFormData();
        if (initialBarcode) {
          initialFormState.variantes = [
            {
              id: `temp-${Date.now()}`,
              nombre: "",
              cantidad: 0,
              precio_1: 0,
              precio_2: 0,
              precio_3: 0,
              precio_4: 0,
              costo_base_venta: 0,
              codigos_barras: [initialBarcode],
              atributos: {},
              imagenes: [],
            },
          ];
        }
        setFormData(initialFormState);
      }
    }
  }, [product, open, initialBarcode]);

  const handleSetPrincipalProvider = (proveedorId: number) => {
    setFormData((prev) => ({
      ...prev,
      proveedores: prev.proveedores.map((p) => ({
        ...p,
        es_principal: p.id === proveedorId,
      })),
    }));
  };

  const handleAddVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variantes: [
        ...prev.variantes,
        {
          id: `temp-${Date.now()}`,
          nombre: "",
          cantidad: 0,
          precio_1: 0,
          precio_2: 0,
          precio_3: 0,
          precio_4: 0,
          costo_base_venta: 0,
          codigos_barras: [],
          atributos: {},
          imagenes: [],
        },
      ],
    }));
  };

  const handleDuplicateVariant = (index: number) => {
    const variantToCopy = formData.variantes[index];
    setFormData((prev) => ({
      ...prev,
      variantes: [
        ...prev.variantes,
        {
          ...variantToCopy,
          id: `temp-${Date.now()}`,
          nombre: `${variantToCopy.nombre} (Copia)`,
          codigos_barras: [],
        },
      ],
    }));
  };

  const handleRemoveVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variantes: prev.variantes.filter((_, i) => i !== index),
    }));
  };

  const handleVariantChange = (
    index: number,
    field: keyof Omit<Variante, "id" | "atributos" | "imagenes">,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      variantes: prev.variantes.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      ),
    }));
  };

  const handleAddBarcode = (variantIndex: number, barcode: string) => {
    if (!barcode.trim()) return;
    const currentBarcodes = formData.variantes[variantIndex].codigos_barras;
    if (!currentBarcodes.includes(barcode.trim())) {
      handleVariantChange(variantIndex, "codigos_barras", [
        ...currentBarcodes,
        barcode.trim(),
      ]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !formData.nombre.trim() ||
      !formData.marca?.nombre ||
      !formData.linea?.nombre
    ) {
      enqueueSnackbar("Nombre del Producto, Marca y Línea son requeridos.", {
        variant: "error",
      });
      return;
    }
    if (formData.variantes.length === 0) {
      enqueueSnackbar("Debe añadir al menos una variante al producto.", {
        variant: "error",
      });
      return;
    }
    for (const [index, variante] of formData.variantes.entries()) {
      if (!variante.nombre.trim()) {
        enqueueSnackbar(`La variante #${index + 1} debe tener un nombre.`, {
          variant: "error",
        });
        return;
      }
      if (!variante.precio_1 || variante.precio_1 <= 0) {
        enqueueSnackbar(
          `La variante "${variante.nombre}" debe tener un precio de venta mayor a cero.`,
          { variant: "error" }
        );
        return;
      }
      if (!variante.cantidad || variante.cantidad <= 0) {
        enqueueSnackbar(
          `La variante "${variante.nombre}" debe tener un contenido/cantidad mayor a cero.`,
          { variant: "error" }
        );
        return;
      }
      if (variante.codigos_barras.length === 0) {
        enqueueSnackbar(
          `La variante "${variante.nombre}" debe tener al menos un código de barras.`,
          { variant: "error" }
        );
        return;
      }
    }

    const { categoria_principal, ...payloadBase } = formData;
    const payload = {
      ...payloadBase,
      categoria_principal,
      proveedores: formData.proveedores.map((p) => ({
        id: p.id,
        es_principal: p.es_principal,
      })),
      categorias_secundarias: formData.categorias_secundarias.map((c) =>
        typeof c === "string" ? { id: 0, nombre: c } : c
      ),
      variantes: formData.variantes.map((v) => {
        const { id, ...rest } = v;
        return typeof id === "string" && id.startsWith("temp-") ? rest : v;
      }),
    };

    try {
      let response;
      if (product) {
        response = await apiClient.put(`/productos/${product.id}`, payload);
        enqueueSnackbar("Producto actualizado con éxito", {
          variant: "success",
        });
      } else {
        response = await apiClient.post("/productos", payload);
        enqueueSnackbar("Producto creado con éxito", { variant: "success" });
      }
      onClose(response.data.data);
    } catch (error: any) {
      console.error("Error al guardar producto:", error.response?.data);
      enqueueSnackbar(
        error.response?.data?.message || "Error al guardar el producto",
        { variant: "error" }
      );
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose()} fullWidth maxWidth="lg">
      <DialogTitle>
        {product ? "Editar Producto" : "Nuevo Producto"}
        <IconButton
          onClick={() => onClose()}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            id="product-form-in-dialog"
          >
            <Grid container spacing={3} sx={{ pt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Nombre del Producto / Categoría Principal"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, nombre: e.target.value }))
                  }
                  helperText="Este nombre también definirá la Categoría Principal."
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  freeSolo
                  options={marcas}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.nombre
                  }
                  value={formData.marca}
                  onChange={(_, newValue) => {
                    setFormData((p) => ({
                      ...p,
                      marca:
                        typeof newValue === "string"
                          ? { id: 0, nombre: newValue }
                          : newValue,
                      linea: null,
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Marca" required />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  freeSolo
                  options={lineas}
                  disabled={!formData.marca}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.nombre
                  }
                  value={formData.linea}
                  onChange={(_, newValue) => {
                    setFormData((p) => ({
                      ...p,
                      linea:
                        typeof newValue === "string"
                          ? { id: 0, nombre: newValue }
                          : newValue,
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Línea de Producto"
                      required
                      helperText={
                        !formData.marca ? "Seleccione una marca primero" : ""
                      }
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={allProveedores}
                  getOptionLabel={(option) => option.nombre}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  value={formData.proveedores}
                  onChange={(_, newValue) => {
                    const principal = formData.proveedores.find(
                      (p) => p.es_principal
                    );
                    const newIds = newValue.map((p) => p.id);
                    if (principal && !newIds.includes(principal.id)) {
                      setFormData((p) => ({
                        ...p,
                        proveedores: newValue.map((prov) => ({
                          ...prov,
                          es_principal: false,
                        })),
                      }));
                    } else {
                      setFormData((p) => ({ ...p, proveedores: newValue }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Proveedores Asociados"
                      placeholder="Seleccione proveedores"
                    />
                  )}
                />
                {formData.proveedores.length > 0 && (
                  <Box
                    sx={{
                      mt: 1,
                      p: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="caption">
                      Marcar como proveedor principal:
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      {formData.proveedores.map((p) => (
                        <FormControlLabel
                          key={p.id}
                          control={
                            <Checkbox
                              checked={!!p.es_principal}
                              onChange={() => handleSetPrincipalProvider(p.id)}
                              name={p.nombre}
                            />
                          }
                          label={p.nombre}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Descripción"
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, descripcion: e.target.value }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={unidades}
                  getOptionLabel={(option) =>
                    `${option.nombre} (${option.simbolo})`
                  }
                  value={
                    unidades.find(
                      (u) => u.nombre === formData.unidad_medida_base
                    ) || null
                  }
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  onChange={(_, newValue) =>
                    setFormData((p) => ({
                      ...p,
                      unidad_medida_base: newValue?.nombre || "",
                    }))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Unidad de Medida Base"
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={categorias}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.nombre
                  }
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  value={formData.categorias_secundarias}
                  onChange={(_, newValue) => {
                    const updatedValue = newValue.map((item) =>
                      typeof item === "string" ? { id: 0, nombre: item } : item
                    );
                    setFormData((p) => ({
                      ...p,
                      categorias_secundarias: updatedValue,
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Categorías Secundarias" />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">Variantes</Typography>
                {formData.variantes.map((variante, index) => (
                  <Paper key={variante.id} sx={{ p: 2, my: 2 }} elevation={2}>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box sx={{ flexGrow: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6} md={3}>
                            <TextField
                              fullWidth
                              required
                              label="Nombre Variante (ej. Color)"
                              value={variante.nombre}
                              onChange={(e) =>
                                handleVariantChange(
                                  index,
                                  "nombre",
                                  e.target.value
                                )
                              }
                            />
                          </Grid>
                          <Grid item xs={6} sm={3} md={2}>
                            <TextField
                              fullWidth
                              required
                              label="Contenido"
                              type="number"
                              value={variante.cantidad}
                              onChange={(e) =>
                                handleVariantChange(
                                  index,
                                  "cantidad",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <Typography
                                      variant="caption"
                                      sx={{ ml: 0.5 }}
                                    >
                                      {formData.unidad_medida_base}
                                    </Typography>
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                          <Grid item xs={6} sm={3} md={3}>
                            <TextField
                              fullWidth
                              required
                              label="Costo Base p/ Venta"
                              type="number"
                              value={variante.costo_base_venta || ""}
                              onChange={(e) =>
                                handleVariantChange(
                                  index,
                                  "costo_base_venta",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    $
                                  </InputAdornment>
                                ),
                              }}
                              helperText="Base para precios"
                            />
                          </Grid>
                          {/* --- CORRECCIÓN CRÍTICA AQUÍ --- */}
                          <Grid item xs={12} sm={6} md={4}>
                            <TextField
                              fullWidth
                              required
                              label="Precio de Venta"
                              type="number"
                              value={variante.precio_1}
                              onChange={(e) =>
                                handleVariantChange(
                                  index,
                                  "precio_1",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    $
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              required
                              label="Añadir Código de Barras"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddBarcode(
                                    index,
                                    (e.target as HTMLInputElement).value
                                  );
                                  (e.target as HTMLInputElement).value = "";
                                }
                              }}
                            />
                            <Box
                              sx={{
                                mt: 1,
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                              }}
                            >
                              {variante.codigos_barras.map((code, i) => (
                                <Chip
                                  key={`${code}-${i}`}
                                  label={code}
                                  onDelete={() =>
                                    handleVariantChange(
                                      index,
                                      "codigos_barras",
                                      variante.codigos_barras.filter(
                                        (c) => c !== code
                                      )
                                    )
                                  }
                                />
                              ))}
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                      <Stack direction="column" spacing={0.5}>
                        <Tooltip title="Copiar Variante">
                          <IconButton
                            size="small"
                            onClick={() => handleDuplicateVariant(index)}
                          >
                            <ContentCopy />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar Variante">
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveVariant(index)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
                <Button
                  startIcon={<AddCircleOutline />}
                  onClick={handleAddVariant}
                >
                  Añadir Variante
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()}>Cancelar</Button>
        <Button variant="contained" type="submit" form="product-form-in-dialog">
          Guardar Producto
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductForm;
