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
  Chip,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import { Close, AddPhotoAlternate, Delete } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import apiClient from "../api/client";

interface MarcaFormProps {
  open: boolean;
  onClose: () => void;
  marca?: any;
}

interface BannerPreview {
  file: File;
  preview: string;
  tipo: string;
}

const MarcaForm = ({ open, onClose, marca }: MarcaFormProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    nombre: "",
    banner_type: "static",
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [banners, setBanners] = useState<BannerPreview[]>([]);

  useEffect(() => {
    if (marca) {
      setFormData({
        nombre: marca.nombre,
        banner_type: marca.banner_type,
      });
      setLogoPreview(marca.logo_url);
      // Cargar banners existentes si estamos editando
    }
  }, [marca]);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "banner"
  ) => {
    const files = e.target.files;
    if (!files) return;

    if (type === "logo") {
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        setErrors({ ...errors, logo: "Solo se permiten imágenes" });
        return;
      }
      setLogoPreview(URL.createObjectURL(file));
      setErrors({ ...errors, logo: "" });
    } else {
      const newBanners = Array.from(files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        tipo: "secundario",
      }));
      setBanners([...banners, ...newBanners]);
    }
    e.target.value = ""; // Reset input
  };

  const removeBanner = (index: number) => {
    const newBanners = [...banners];
    newBanners.splice(index, 1);
    setBanners(newBanners);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre) newErrors.nombre = "Nombre requerido";
    if (!logoPreview) newErrors.logo = "Logo requerido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formPayload = new FormData();
      formPayload.append("nombre", formData.nombre);
      formPayload.append("bannerType", formData.banner_type);

      // Agregar logo
      if (logoPreview && typeof logoPreview !== "string") {
        // Si es una nueva imagen
        // formPayload.append("logo", logoFile);
      }

      // Agregar banners
      banners.forEach((banner, index) => {
        formPayload.append(`banners`, banner.file);
      });

      const endpoint = marca?.id ? `/marcas/${marca.id}` : "/marcas";
      const method = marca?.id ? "put" : "post";

      await apiClient[method](endpoint, formPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      enqueueSnackbar(`Marca ${marca?.id ? "actualizada" : "creada"}`, {
        variant: "success",
      });
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || "Error guardando", {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {marca ? "Editar Marca" : "Nueva Marca"}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Campo Nombre */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre de la marca"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              error={!!errors.nombre}
              helperText={errors.nombre}
            />
          </Grid>

          {/* Tipo de Banner */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de banner principal</InputLabel>
              <Select
                value={formData.banner_type}
                label="Tipo de banner principal"
                onChange={(e) =>
                  setFormData({ ...formData, banner_type: e.target.value })
                }
              >
                <MenuItem value="static">Imagen estática</MenuItem>
                <MenuItem value="gif">GIF animado</MenuItem>
              </Select>
              <FormHelperText>
                Solo aplica para el banner principal
              </FormHelperText>
            </FormControl>
          </Grid>

          {/* Upload Logo */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Logo de la marca
            </Typography>
            <input
              accept="image/*"
              id="logo-upload"
              type="file"
              hidden
              onChange={(e) => handleFileUpload(e, "logo")}
            />
            <label htmlFor="logo-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<AddPhotoAlternate />}
              >
                Subir logo
              </Button>
            </label>
            {errors.logo && (
              <Typography color="error" variant="caption">
                {errors.logo}
              </Typography>
            )}
            {logoPreview && (
              <Box mt={2} sx={{ maxWidth: 200 }}>
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  style={{ maxHeight: 100 }}
                />
              </Box>
            )}
          </Grid>

          {/* Banners */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Banners promocionales
            </Typography>
            <input
              accept="image/*"
              id="banner-upload"
              type="file"
              hidden
              multiple
              onChange={(e) => handleFileUpload(e, "banner")}
            />
            <label htmlFor="banner-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<AddPhotoAlternate />}
              >
                Agregar banners
              </Button>
            </label>

            <Box mt={2} sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {banners.map((banner, index) => (
                <Box
                  key={index}
                  sx={{ position: "relative", width: 200, height: 150 }}
                >
                  <img
                    src={banner.preview}
                    alt={`Banner ${index + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <IconButton
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      bgcolor: "rgba(0,0,0,0.5)",
                      color: "white",
                    }}
                    onClick={() => removeBanner(index)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MarcaForm;
