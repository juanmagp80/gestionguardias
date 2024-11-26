"use client"
import {
    Box,
    Button,
    Checkbox,
    Container,
    FormControl,
    FormControlLabel,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography
} from '@mui/material';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { useEffect, useState } from 'react';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ReplanteoPDFGenerator() {
    const [formData, setFormData] = useState({
        codigo: '',
        responsableVdf: 'DIEGO VIDAL',
        telefonoResponsable: '610514558',
        fecha: '',
        cliente: '',
        direccion: '',
        provinciaId: '',
        provincia: '',
        personaContacto: '',
        telefonoContacto: '',
        tecnicoId: '',
        tecnico: '',
        telefonoTecnico: '',
        motivoInstalacion: '',
        materiales: '1',
        plataformaElevadora: false,
        acometidaEspecial: false,
        tipoAcometida: ''
    });

    const [provincias, setProvincias] = useState([]);
    const [tecnicos, setTecnicos] = useState([]);
    const [tecnicosFiltrados, setTecnicosFiltrados] = useState([]);
    const [fotos, setFotos] = useState([]);
    const [fotosPreview, setFotosPreview] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchProvincias();
        fetchTecnicos();
    }, []);

    const fetchProvincias = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase.from('provincias').select('*');

            if (error) {
                console.error('Error al cargar provincias:', error);
                return;
            }

            console.log('Provincias cargadas:', data);
            setProvincias(data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTecnicos = async () => {
        const { data, error } = await supabase.from('tecnicos').select('*');
        if (error) {
            console.error('Error al obtener técnicos:', error);
        } else {
            setTecnicos(data || []);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckChange = (event) => {
        const { name, checked } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const handleProvinciaChange = (e) => {
        const provinciaId = e.target.value;
        const provinciaSeleccionada = provincias.find(p => p.id === provinciaId);

        if (provinciaSeleccionada) {
            setFormData(prev => ({
                ...prev,
                provinciaId: provinciaId,
                provincia: provinciaSeleccionada.nombre,
                tecnicoId: '',
                tecnico: '',
                telefonoTecnico: ''
            }));

            const tecnicosDeProvincia = tecnicos.filter(t => t.provincia_id === provinciaId);
            setTecnicosFiltrados(tecnicosDeProvincia);
        }
    };

    const handleTecnicoChange = (e) => {
        const tecnicoId = e.target.value;
        const tecnicoSeleccionado = tecnicosFiltrados.find(t => t.id === tecnicoId);

        if (tecnicoSeleccionado) {
            setFormData(prev => ({
                ...prev,
                tecnicoId: tecnicoId,
                tecnico: tecnicoSeleccionado.nombre,
                telefonoTecnico: tecnicoSeleccionado.telefono
            }));
        }
    };

    const handleFotosChange = (event) => {
        const files = Array.from(event.target.files);
        setFotos(files);

        const previews = files.map(file => URL.createObjectURL(file));
        setFotosPreview(previews);
    };

    const splitTextIntoLines = (text, maxWidth, font) => {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = font.widthOfTextAtSize(currentLine + ' ' + word, 10);

            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    };

    const drawHeader = async (page, width, height, pdfDoc, font, fontBold) => {
        const logoLeftBytes = await fetch('/logoinstelca.png').then(res => res.arrayBuffer());
        const logoRightBytes = await fetch('vodafone.png').then(res => res.arrayBuffer());

        const logoLeft = await pdfDoc.embedPng(logoLeftBytes);
        const logoRight = await pdfDoc.embedPng(logoRightBytes);

        const logoLeftWidth = logoLeft.width * 0.8;
        const logoLeftHeight = logoLeft.height * 0.8;
        const logoRightWidth = logoRight.width * 0.8;
        const logoRightHeight = logoRight.height * 0.8;

        page.drawImage(logoLeft, {
            x: 50,
            y: height - logoLeftHeight - 30,
            width: logoLeftWidth,
            height: logoLeftHeight,
        });

        page.drawImage(logoRight, {
            x: width - logoRightWidth - 50,
            y: height - logoRightHeight - 30,
            width: logoRightWidth,
            height: logoRightHeight,
        });

        page.drawText('INFORME DE REPLANTEO PARA', {
            x: (width - font.widthOfTextAtSize('INFORME DE REPLANTEO PARA', 14)) / 2,
            y: height - 60,
            size: 14,
            font: fontBold,
        });

        page.drawText('INSTALACIONES DE VODAFONE GGCC', {
            x: (width - font.widthOfTextAtSize('INSTALACIONES DE VODAFONE GGCC', 12)) / 2,
            y: height - 80,
            size: 12,
            font: fontBold,
        });

        page.drawRectangle({
            x: 50,
            y: height - 100,
            width: width - 100,
            height: 1,
            color: rgb(0, 0, 0),
        });
    };

    const generatePDF = async () => {
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const firstPage = pdfDoc.addPage([595.28, 841.89]);
        const { width, height } = firstPage.getSize();

        await drawHeader(firstPage, width, height, pdfDoc, font, fontBold);

        let yPos = height - 130;

        const drawSection = (title, y) => {
            firstPage.drawText(title, {
                x: 50,
                y,
                size: 12,
                font: fontBold,
            });
        };

        const drawField = (label, value, x, y) => {
            firstPage.drawText(`${label}: ${value}`, {
                x,
                y,
                size: 10,
                font,
            });
        };

        // Sección 1
        drawSection('1. DATOS DE LA INSTALACIÓN Y PERSONA DE CONTACTO', yPos);

        yPos -= 20;
        drawField('CODIGO VDF', formData.codigo, 50, yPos);
        drawField('RESPONSABLE VDF (indicar tfno.)', `${formData.responsableVdf} (${formData.telefonoResponsable})`, 300, yPos);

        yPos -= 20;
        drawField('FECHA', formData.fecha, 50, yPos);

        yPos -= 20;
        drawField('CLIENTE', formData.cliente, 50, yPos);
        drawField('DIRECCION', formData.direccion, 300, yPos);

        yPos -= 20;
        drawField('PROVINCIA', formData.provincia, 50, yPos);
        drawField('PERSONA DE CONTACTO', formData.personaContacto, 300, yPos);

        yPos -= 20;
        drawField('TFNO', formData.telefonoContacto, 300, yPos);

        // Sección 2
        yPos -= 40;
        drawSection('2. DATOS DEL TECNICO', yPos);

        yPos -= 20;
        drawField('NOMBRE Y CORE DEL TECNICO', formData.tecnico, 50, yPos);
        yPos -= 15;
        drawField('TFNO', formData.telefonoTecnico, 50, yPos);

        // Sección 3
        yPos -= 40;
        drawSection('3. MOTIVO Y BREVE DESCRIPCIÓN DE LA INSTALACIÓN A REALIZAR', yPos);

        yPos -= 20;
        const lines = splitTextIntoLines(formData.motivoInstalacion, width - 100, font);
        lines.forEach((line, index) => {
            firstPage.drawText(line, {
                x: 50,
                y: yPos - (index * 15),
                size: 10,
                font,
            });
        });

        yPos -= (lines.length * 15 + 20);

        // Sección 4
        drawSection('4. MATERIALES A SUMINISTRAR', yPos);

        yPos -= 20;
        drawField('1/2/3 técnicos', formData.materiales, 50, yPos);

        if (formData.plataformaElevadora) {
            yPos -= 20;
            drawField('Plataforma Elevadora', 'Sí', 50, yPos);
        }

        if (formData.acometidaEspecial) {
            yPos -= 20;
            drawField('Acometida Especial', formData.tipoAcometida, 50, yPos);
        }

        if (fotos.length > 0) {
            for (const foto of fotos) {
                const photoPage = pdfDoc.addPage([595.28, 841.89]);
                await drawHeader(photoPage, width, height, pdfDoc, font, fontBold);

                const fotoBytes = await foto.arrayBuffer();
                let image;

                if (foto.type === 'image/jpeg') {
                    image = await pdfDoc.embedJpg(fotoBytes);
                } else if (foto.type === 'image/png') {
                    image = await pdfDoc.embedPng(fotoBytes);
                }

                const { width: imgWidth, height: imgHeight } = image.size();
                const scale = Math.min(
                    (width - 100) / imgWidth,
                    (height - 200) / imgHeight
                );

                photoPage.drawImage(image, {
                    x: 50,
                    y: height - (imgHeight * scale) - 150,
                    width: imgWidth * scale,
                    height: imgHeight * scale,
                });
            }
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Replanteo_${formData.codigo}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };


    return (
        <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Generador de Informe de Replanteo Vodafone
                </Typography>
                <Box component="form" noValidate autoComplete="off">
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Código VDF"
                                name="codigo"
                                value={formData.codigo}
                                onChange={handleInputChange}
                                variant="outlined"
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Fecha"
                                name="fecha"
                                type="date"
                                value={formData.fecha}
                                onChange={handleInputChange}
                                variant="outlined"
                                margin="normal"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Responsable VDF"
                                name="responsableVdf"
                                value={formData.responsableVdf}
                                onChange={handleInputChange}
                                variant="outlined"
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Teléfono Responsable"
                                name="telefonoResponsable"
                                value={formData.telefonoResponsable}
                                onChange={handleInputChange}
                                variant="outlined"
                                margin="normal"
                                type="tel"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Cliente"
                                name="cliente"
                                value={formData.cliente}
                                onChange={handleInputChange}
                                variant="outlined"
                                margin="normal"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Dirección"
                                name="direccion"
                                value={formData.direccion}
                                onChange={handleInputChange}
                                variant="outlined"
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth variant="outlined" margin="normal">
                                <InputLabel>Provincia</InputLabel>
                                <Select
                                    name="provincia"
                                    value={formData.provinciaId || ''} // Usamos provinciaId para el select
                                    onChange={handleProvinciaChange}
                                    label="Provincia"
                                >
                                    {provincias.map((provincia) => (
                                        <MenuItem key={provincia.id} value={provincia.id}>
                                            {provincia.nombre}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Persona de Contacto"
                                name="personaContacto"
                                value={formData.personaContacto}
                                onChange={handleInputChange}
                                variant="outlined"
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Teléfono Contacto"
                                name="telefonoContacto"
                                value={formData.telefonoContacto}
                                onChange={handleInputChange}
                                variant="outlined"
                                margin="normal"
                                type="tel"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth variant="outlined" margin="normal">
                                <InputLabel>Técnico</InputLabel>
                                <Select
                                    name="tecnico"
                                    value={formData.tecnicoId || ''} // Usamos tecnicoId para el select
                                    onChange={handleTecnicoChange}
                                    label="Técnico"
                                    disabled={!formData.provincia}
                                >
                                    {tecnicosFiltrados.map((tecnico) => (
                                        <MenuItem key={tecnico.id} value={tecnico.id}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <Typography>{tecnico.nombre}</Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {tecnico.telefono}
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Teléfono Técnico"
                                name="telefonoTecnico"
                                value={formData.telefonoTecnico}
                                onChange={handleInputChange}
                                variant="outlined"
                                margin="normal"
                                type="tel"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl fullWidth variant="outlined" margin="normal">
                                <InputLabel>Número de Técnicos</InputLabel>
                                <Select
                                    name="materiales"
                                    value={formData.materiales}
                                    onChange={handleInputChange}
                                    label="Número de Técnicos"
                                >

                                    <MenuItem value="1">1 Técnico</MenuItem>
                                    <MenuItem value="2">2 Técnicos</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.plataformaElevadora}
                                        onChange={handleCheckChange}
                                        name="plataformaElevadora"
                                    />
                                }
                                label="Plataforma Elevadora"
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.acometidaEspecial}
                                        onChange={handleCheckChange}
                                        name="acometidaEspecial"
                                    />
                                }
                                label="Acometida Especial"
                            />
                        </Grid>

                        {formData.acometidaEspecial && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Tipo de Acometida"
                                    name="tipoAcometida"
                                    value={formData.tipoAcometida}
                                    onChange={handleInputChange}
                                    variant="outlined"
                                    margin="normal"
                                />
                            </Grid>
                        )}



                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Motivo y Descripción de Instalación"
                                name="motivoInstalacion"
                                value={formData.motivoInstalacion}
                                onChange={handleInputChange}
                                variant="outlined"
                                margin="normal"
                                multiline
                                rows={4}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                component="label"
                                fullWidth
                                sx={{ mb: 2 }}
                            >
                                Subir Fotos
                                <input
                                    type="file"
                                    hidden
                                    multiple
                                    accept="image/*"
                                    onChange={handleFotosChange}
                                />
                            </Button>

                            {/* Previsualización de fotos */}
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                                {fotosPreview.map((preview, index) => (
                                    <Box
                                        key={index}
                                        component="img"
                                        src={preview}
                                        sx={{
                                            width: 100,
                                            height: 100,
                                            objectFit: 'cover',
                                            borderRadius: 1
                                        }}
                                    />
                                ))}
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="primary"
                                onClick={generatePDF}
                            >
                                Generar Informe PDF
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
}
