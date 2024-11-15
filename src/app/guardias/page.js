"use client";
import { es } from 'date-fns/locale';
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import { CSVLink } from "react-csv";
import { supabase } from "../../../lib/supabaseClient";

export default function AsignacionGuardias() {
    const [provinciaId, setProvinciaId] = useState("");
    const [tecnicosOrden, setTecnicosOrden] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [tecnicos, setTecnicos] = useState([]);
    const [semanaInicio, setSemanaInicio] = useState(null);
    const [guardias, setGuardias] = useState([]);
    const [mensaje, setMensaje] = useState("");
    const [tecnicoSeleccionadoCambio, setTecnicoSeleccionadoCambio] = useState({});

    useEffect(() => {
        cargarProvincias();
    }, []);

    useEffect(() => {
        if (provinciaId) {
            cargarTecnicos();
            cargarGuardias();
        }
    }, [provinciaId]);

    useEffect(() => {
        if (semanaInicio) {
            cargarGuardias();
        }
    }, [semanaInicio]);

    const cargarProvincias = async () => {
        const { data } = await supabase.from('provincias').select('*');
        setProvincias(data || []);
    };

    const cargarTecnicos = async () => {
        const { data } = await supabase
            .from('tecnicos')
            .select('*')
            .eq('provincia_id', provinciaId);
        setTecnicos(data || []);
        setTecnicosOrden(new Array(data.length).fill(null));
    };



    const asignarGuardias = async () => {
        if (!provinciaId || !semanaInicio || tecnicosOrden.length === 0 || tecnicosOrden.includes(null)) {
            setMensaje("Selecciona provincia, semana y orden de técnicos");
            return;
        }

        try {
            const nuevasGuardias = [];
            const fechaInicio = new Date(semanaInicio);
            const fechaFin = new Date(fechaInicio);
            fechaFin.setDate(fechaInicio.getDate() + 6);

            for (let i = 0; i < 12; i++) {
                const fecha = new Date(fechaInicio);
                fecha.setDate(fecha.getDate() + (i * 7));
                const semana = obtenerSemana(fecha);

                const tecnicoIndex = i % tecnicosOrden.length;
                const tecnicoAsignado = tecnicosOrden[tecnicoIndex];

                if (!tecnicoAsignado || !tecnicoAsignado.id) {
                    throw new Error(`Técnico no válido en la posición ${tecnicoIndex}`);
                }

                nuevasGuardias.push({
                    fecha_guardia: fecha.toISOString().split('T')[0],
                    tecnico_id: tecnicoAsignado.id,
                    provincia_id: provinciaId,
                    pago: 100
                });
            }

            const { error: deleteError } = await supabase
                .from('guardias')
                .delete()
                .eq('provincia_id', provinciaId)
                .gte('fecha_guardia', fechaInicio.toISOString().split('T')[0])
                .lte('fecha_guardia', fechaFin.toISOString().split('T')[0]);

            if (deleteError) throw deleteError;

            const { error: insertError } = await supabase
                .from('guardias')
                .insert(nuevasGuardias);

            if (insertError) throw insertError;

            setMensaje("Guardias asignadas correctamente");
            await cargarGuardias();
        } catch (error) {
            console.error("Error al asignar guardias:", error);
            setMensaje(`Error al asignar guardias: ${error.message}`);
        }
    };

    const cargarGuardias = async () => {
        if (!semanaInicio) return;

        const fechaInicio = new Date(semanaInicio);
        const fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaInicio.getDate() + 6);

        try {
            const { data, error } = await supabase
                .from('guardias')
                .select(`
              id,
              fecha_guardia,
              tecnico_id,
              provincia_id,
              pago,
              tecnicos (id, nombre),
              provincias (id, nombre)
            `)
                .gte('fecha_guardia', fechaInicio.toISOString().split('T')[0])
                .lte('fecha_guardia', fechaFin.toISOString().split('T')[0])
                .order('provincias (nombre)', { ascending: true })
                .order('fecha_guardia', { ascending: true });

            if (error) {
                console.error("Error al cargar guardias:", error);
                setMensaje("Error al cargar guardias");
                return;
            }

            setGuardias(data || []);
        } catch (error) {
            console.error("Error al cargar guardias:", error);
            setMensaje("Error al cargar guardias");
        }
    };

    const cambiarTecnico = async (guardiaId, nuevoTecnicoId) => {
        if (!nuevoTecnicoId) {
            setMensaje("Selecciona un nuevo técnico");
            return;
        }

        try {
            console.log(`Actualizando guardia con ID: ${guardiaId}, Técnico ID: ${nuevoTecnicoId}`);

            const { data: guardiaExistente, error: errorExistente } = await supabase
                .from('guardias')
                .select('id')
                .eq('id', guardiaId)
                .single();

            if (errorExistente || !guardiaExistente) {
                throw new Error('No se encontró la guardia para actualizar');
            }

            const { data, error } = await supabase
                .from('guardias')
                .update({ tecnico_id: nuevoTecnicoId })
                .eq('id', guardiaId)
                .select();

            if (error) {
                console.error("Error al actualizar la guardia:", error.message);
                throw error;
            }

            console.log('Respuesta de la base de datos:', data);

            setMensaje("Técnico cambiado correctamente");
            await cargarGuardias();
            setTecnicoSeleccionadoCambio({});
        } catch (error) {
            console.error("Error al cambiar técnico:", error.message);
            setMensaje("Error al cambiar técnico: " + error.message);
        }
    };

    const handleCalendarClick = (date) => {
        if (date.getDay() === 1) {
            setSemanaInicio(date);
        } else {
            setMensaje("Por favor, selecciona un lunes");
        }
    };

    const handleOrdenTecnicosChange = (index, tecnicoId) => {
        const nuevoOrden = [...tecnicosOrden];
        nuevoOrden[index] = tecnicos.find(t => t.id === tecnicoId);
        setTecnicosOrden(nuevoOrden);
    };

    const isOrdenCompleto = () => {
        return tecnicosOrden.length === tecnicos.length && tecnicosOrden.every(t => t);
    };

    const obtenerSemana = (fecha) => {
        const inicioSemana = new Date(fecha);
        inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay() + (inicioSemana.getDay() === 0 ? -6 : 1));
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(finSemana.getDate() + 6);
        return `${inicioSemana.toLocaleDateString()} - ${finSemana.toLocaleDateString()}`;
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 text-white">Asignación de Guardias</h1>

            <div className="space-y-4 mb-6">
                <select
                    value={provinciaId}
                    onChange={(e) => setProvinciaId(e.target.value)}
                    className="w-full p-2 border rounded"
                >
                    <option value="">Selecciona Provincia</option>
                    {provincias.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                </select>

                <div className="calendar-container">
                    <Calendar
                        onChange={handleCalendarClick}
                        value={semanaInicio}
                        locale={es}
                        className="w-full border rounded bg-white"
                    />
                </div>

                <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-white">Orden de Técnicos</h2>
                    {tecnicos.map((tecnico, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <span className="text-white">{index + 1}.</span>
                            <select
                                value={tecnicosOrden[index]?.id || ""}
                                onChange={(e) => handleOrdenTecnicosChange(index, parseInt(e.target.value))}
                                className="w-full p-2 border rounded"
                            >
                                <option value="">Seleccionar técnico</option>
                                {tecnicos.map(t => (
                                    <option key={t.id} value={t.id}>{t.nombre}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>

                <button
                    onClick={asignarGuardias}
                    disabled={!provinciaId || !semanaInicio || !isOrdenCompleto()}
                    className="w-full p-2 bg-red-500 text-white rounded disabled:bg-gray-300"
                >
                    Asignar Guardias
                </button>

                {mensaje && (
                    <div className="p-2 bg-gray-100 rounded text-center">
                        {mensaje}
                    </div>
                )}
            </div>

            <div className="overflow-x-auto mt-6">
                <table className="w-full border rounded-lg bg-white">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border p-2">Semana</th>
                            <th className="border p-2">Provincia</th>
                            <th className="border p-2">Técnico</th>
                            <th className="border p-2">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {guardias.map((guardia) => (
                            <tr key={guardia.id || guardia.fecha_guardia}>
                                <td className="border p-2">
                                    {obtenerSemana(guardia.fecha_guardia)}
                                </td>
                                <td className="border p-2 font-semibold">
                                    {guardia.provincias?.nombre}
                                </td>
                                <td className="border p-2">
                                    {guardia.tecnicos?.nombre || 'No asignado'}
                                </td>
                                <td className="border p-2">
                                    {guardia.provincia_id.toString() === provinciaId.toString() && (
                                        <div className="flex items-center space-x-2">
                                            <select
                                                value={tecnicoSeleccionadoCambio[guardia.id] || ""}
                                                onChange={(e) => {
                                                    const nuevoValor = e.target.value;
                                                    setTecnicoSeleccionadoCambio(prev => ({
                                                        ...prev,
                                                        [guardia.id]: nuevoValor
                                                    }));
                                                }}
                                                className="p-1 border rounded"
                                            >
                                                <option value="">Seleccionar técnico</option>
                                                {tecnicos.map((t) => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('¿Estás seguro de que deseas cambiar el técnico para esta guardia?')) {
                                                        cambiarTecnico(
                                                            guardia.id,
                                                            tecnicoSeleccionadoCambio[guardia.id]
                                                        );
                                                    } else {
                                                        setTecnicoSeleccionadoCambio(prev => ({
                                                            ...prev,
                                                            [guardia.id]: ""
                                                        }));
                                                    }
                                                }}
                                                disabled={!tecnicoSeleccionadoCambio[guardia.id]}
                                                className="bg-blue-500 text-white px-3 py-1 rounded disabled:bg-gray-300"
                                            >
                                                Cambiar
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {guardias.length > 0 && (
                <div className="mt-4">
                    <CSVLink
                        data={guardias.map(g => ({
                            semana: obtenerSemana(g.fecha_guardia),
                            tecnico: g.tecnicos?.nombre || 'No asignado',
                            provincia: g.provincias?.nombre
                        }))}
                        filename="guardias.csv"
                        className="inline-block p-2 bg-green-500 text-white rounded"
                    >
                        Exportar a CSV
                    </CSVLink>
                </div>
            )}
        </div>
    );
}