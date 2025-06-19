import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Stack,
  CircularProgress,
  Grid,
  Divider,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
} from "@mui/material";
import { ArrowBack, PictureAsPdf } from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import apiClient from "../api/client";

const VentaDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [venta, setVenta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiClient
      .get(`/ventas/${id}`)
      .then((res) => setVenta(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleExportPDF = () => {
    if (!venta) return;
    const doc = new jsPDF();

    // Título
    doc.setFontSize(20);
    doc.text("Recibo de Venta", 14, 22);

    // Información General
    autoTable(doc, {
      startY: 30,
      body: [
        ["Código de Venta:", venta.codigo_venta],
        ["Fecha:", new Date(venta.fecha).toLocaleString()],
        ["Cliente:", venta.cliente_nombre],
        [
          "Documento:",
          `${venta.cliente_tipo_documento}-${venta.cliente_documento}`,
        ],
        ["Vendedor:", venta.vendedor_nombre],
      ],
      theme: "plain",
      styles: { fontSize: 10 },
    });

    // Artículos Vendidos
    autoTable(doc, {
      head: [["Producto", "Cant.", "Precio Unit.", "IVA", "Total"]],
      body: venta.detalles.map((item: any) => [
        `${item.producto_nombre} (${item.variante_nombre})`,
        item.cantidad,
        `$${Number(item.precio_unitario).toFixed(2)}`,
        `$${Number(item.iva_monto).toFixed(2)}`,
        `$${(
          item.cantidad *
          (Number(item.precio_unitario) + Number(item.iva_monto))
        ).toFixed(2)}`,
      ]),
      startY: (doc as any).lastAutoTable.finalY + 10,
      headStyles: { fillColor: [22, 160, 133] },
    });

    // Totales
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(10);
    doc.text(
      `Subtotal: $${Number(venta.subtotal).toFixed(2)}`,
      14,
      finalY + 10
    );
    doc.text(
      `IVA (16%): $${Number(venta.total_iva).toFixed(2)}`,
      14,
      finalY + 15
    );
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Total Venta: $${Number(venta.total_venta).toFixed(2)}`,
      14,
      finalY + 22
    );

    doc.save(`recibo_${venta.codigo_venta}.pdf`);
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  if (!venta) return <Alert severity="error">Venta no encontrada.</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton onClick={() => navigate("/ventas")}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" sx={{ ml: 2 }}>
            Detalle de Venta
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PictureAsPdf />}
          onClick={handleExportPDF}
        >
          Exportar Recibo PDF
        </Button>
      </Stack>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              {venta.codigo_venta}
            </Typography>
            <Divider />
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="overline" color="text.secondary">
              Cliente
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {venta.cliente_nombre}
            </Typography>
            <Typography variant="body2">{`${venta.cliente_tipo_documento}-${venta.cliente_documento}`}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="overline" color="text.secondary">
              Fecha
            </Typography>
            <Typography variant="body1">
              {new Date(venta.fecha).toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="overline" color="text.secondary">
              Vendedor
            </Typography>
            <Typography variant="body1">{venta.vendedor_nombre}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="overline" color="text.secondary">
              Estado
            </Typography>
            <Chip
              label={venta.estado}
              color={venta.estado === "completada" ? "success" : "warning"}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mt: 3 }}>
              Artículos Vendidos
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Cant.</TableCell>
                    <TableCell align="right">Precio Unit.</TableCell>
                    <TableCell align="right">IVA</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {venta.detalles.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.producto_nombre} ({item.variante_nombre})
                      </TableCell>
                      <TableCell align="right">{item.cantidad}</TableCell>
                      <TableCell align="right">
                        ${Number(item.precio_unitario).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        ${Number(item.iva_monto).toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        $
                        {(
                          item.cantidad *
                          (Number(item.precio_unitario) +
                            Number(item.iva_monto))
                        ).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mt: 2 }}>
              Pagos Realizados
            </Typography>
            <Paper variant="outlined">
              <List dense>
                {venta.pagos.map((pago: any, index: number) => (
                  <ListItem
                    key={index}
                    divider={index < venta.pagos.length - 1}
                  >
                    <ListItemText
                      primary={`${pago.metodo_nombre}: ${pago.monto.toFixed(
                        2
                      )} ${pago.moneda}`}
                      secondary={
                        pago.referencia
                          ? `Ref: ${pago.referencia}`
                          : "Sin referencia"
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              mt: 2,
            }}
          >
            <Typography variant="body1">
              Subtotal: ${Number(venta.subtotal).toFixed(2)}
            </Typography>
            <Typography variant="body1">
              IVA (16%): ${Number(venta.total_iva).toFixed(2)}
            </Typography>
            <Divider sx={{ my: 1, width: "50%" }} />
            <Typography variant="h5" sx={{ mt: 1 }}>
              Total Venta: ${Number(venta.total_venta).toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default VentaDetailPage;
