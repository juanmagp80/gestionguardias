"use client";
import { es } from 'date-fns/locale';
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import { CSVLink } from "react-csv";
import { supabase } from "../../../lib/supabaseClient";

export default function AsignacionGuardias() {
    const [provinciaId, setProvinciaId] = useState("");
    const [tecnicoId, setTecnicoId] = useState("");
    const [provincias, setProvincias] = useState([]);
    const [tecnicos, setTecnicos] = useState([]);
    const [semanaInicio, setSemanaInicio] = useState(null);
    const [guardias, setGuardias] = useState([]);
    const [mensaje, setMensaje] = useState("");
    const [tecnicoSeleccionadoCambio, setTecnicoSeleccionadoCambio] = useState({});
    const [actualizando, setActualizando] = useState(false);


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
    };

    const cargarGuardias = async () => {
        if (!semanaInicio) return;

        const finSemana = new Date(semanaInicio);
        finSemana.setDate(finSemana.getDate() + 6);

        try {
            const { data, error } = await supabase
                .from('guardias')
                .select(`
                    id,
                    fecha_guardia,
                    tecnico_id,
                    provincia_id,
                    tecnicos (id, nombre),
                    provincias (id, nombre)
                `)
                .gte('fecha_guardia', semanaInicio.toISOString().split('T')[0])
                .lte('fecha_guardia', finSemana.toISOString().split('T')[0])
                .order('provincias (nombre)', { ascending: true })
                .order('fecha_guardia', { ascending: true });

            if (error) throw error;

            // Forzar actualización del estado
            setGuardias([...data]);

        } catch (error) {
            console.error("Error al cargar guardias:", error);
            setMensaje("Error al cargar guardias");
        }
    };

    const asignarGuardias = async () => {
        if (!provinciaId || !tecnicoId || !semanaInicio) {
            setMensaje("Selecciona provincia, técnico y semana");
            return;
        }

        try {
            if (!tecnicos || tecnicos.length === 0) {
                setMensaje("No hay técnicos disponibles");
                return;
            }

            const tecnicoSeleccionado = tecnicos.find(t => t.id.toString() === tecnicoId.toString());

            if (!tecnicoSeleccionado) {
                setMensaje("Técnico seleccionado no encontrado");
                return;
            }

            const otrosTecnicos = tecnicos.filter(t => t.id.toString() !== tecnicoId.toString());
            const tecnicosOrdenados = [tecnicoSeleccionado, ...otrosTecnicos];

            const nuevasGuardias = [];
            const fechaInicio = new Date(semanaInicio);
            const fechaFin = new Date(fechaInicio);
            fechaFin.setDate(fechaFin.getDate() + (12 * 7));

            for (let i = 0; i < 12; i++) {
                const fecha = new Date(fechaInicio);
                fecha.setDate(fecha.getDate() + (i * 7));

                const tecnicoIndex = i % tecnicosOrdenados.length;
                const tecnicoAsignado = tecnicosOrdenados[tecnicoIndex];

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
                .lt('fecha_guardia', fechaFin.toISOString().split('T')[0]);

            if (deleteError) throw deleteError;

            const { error: insertError } = await supabase
                .from('guardias')
                .insert(nuevasGuardias);

            if (insertError) throw insertError;

            setMensaje("Guardias asignadas correctamente");
            cargarGuardias();
        } catch (error) {
            console.error("Error al asignar guardias:", error);
            setMensaje(`Error al asignar guardias: ${error.message}`);
        }
    };
    const cambiarTecnico = async (guardiaId, nuevoTecnicoId, fechaGuardia) => {
        if (!nuevoTecnicoId || actualizando) return;

        try {
            setActualizando(true);

            // 1. Obtener la guardia y provincia actual
            const { data: guardiaActual } = await supabase
                .from('guardias')
                .select('*, tecnicos(nombre)')
                .eq('id', guardiaId)
                .single();

            if (!guardiaActual) {
                throw new Error('Guardia no encontrada');
            }

            // 2. Obtener las guardias futuras
            const { data: guardiasFuturas } = await supabase
                .from('guardias')
                .select('*')
                .eq('provincia_id', guardiaActual.provincia_id)
                .gte('fecha_guardia', fechaGuardia)
                .order('fecha_guardia', { ascending: true });

            if (!guardiasFuturas?.length) return;

            // 3. Crear array de técnicos rotativo
            const tecnicosDisponibles = tecnicos.filter(t => t.provincia_id === guardiaActual.provincia_id);
            const nuevoTecnicoIndex = tecnicosDisponibles.findIndex(t => t.id.toString() === nuevoTecnicoId.toString());
            const tecnicosRotados = [
                ...tecnicosDisponibles.slice(nuevoTecnicoIndex),
                ...tecnicosDisponibles.slice(0, nuevoTecnicoIndex)
            ];

            // 4. Actualizar cada guardia
            const actualizaciones = guardiasFuturas.map((guardia, index) => ({
                id: guardia.id,
                tecnico_id: tecnicosRotados[index % tecnicosRotados.length].id
            }));

            // 5. Realizar actualizaciones en batch
            for (const actualizacion of actualizaciones) {
                const { error } = await supabase
                    .from('guardias')
                    .update({ tecnico_id: actualizacion.tecnico_id })
                    .eq('id', actualizacion.id);

                if (error) throw error;
            }

            // 6. Recargar guardias
            await cargarGuardias();

            setMensaje("Guardias actualizadas correctamente");
            setTecnicoSeleccionadoCambio({});
        } catch (error) {
            console.error("Error al cambiar técnico:", error);
            setMensaje("Error al actualizar guardias: " + error.message);
        } finally {
            setActualizando(false);
        }
    };
    const handleCalendarClick = (date) => {
        if (date.getDay() === 1) {
            setSemanaInicio(date);
        } else {
            setMensaje("Por favor, selecciona un lunes");
        }
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

                <select
                    value={tecnicoId}
                    onChange={(e) => setTecnicoId(e.target.value)}
                    className="w-full p-2 border rounded"
                    disabled={!provinciaId}
                >
                    <option value="">Selecciona Técnico Inicial</option>
                    {tecnicos.map(t => (
                        <option key={t.id} value={t.id}>{t.nombre}</option>
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

                <button
                    onClick={asignarGuardias}
                    disabled={!provinciaId || !tecnicoId || !semanaInicio}
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
                            <th className="border p-2">Fecha</th>
                            <th className="border p-2">Provincia</th>
                            <th className="border p-2">Técnico</th>
                            <th className="border p-2">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {guardias.map((guardia) => (
                            <tr key={guardia.id || guardia.fecha_guardia}>
                                <td className="border p-2">
                                    {new Date(guardia.fecha_guardia).toLocaleDateString()}
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
                                                    if (window.confirm('¿Estás seguro de que deseas cambiar el técnico para esta guardia y las siguientes?')) {
                                                        cambiarTecnico(
                                                            guardia.id,
                                                            tecnicoSeleccionadoCambio[guardia.id],
                                                            guardia.fecha_guardia
                                                        );
                                                    }
                                                }}
                                                disabled={actualizando || !tecnicoSeleccionadoCambio[guardia.id]}
                                                className="bg-blue-500 text-white px-3 py-1 rounded disabled:bg-gray-300"
                                            >
                                                {actualizando ? 'Actualizando...' : 'Cambiar'}
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
                            fecha: g.fecha_guardia,
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