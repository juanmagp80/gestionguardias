"use client";

import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { useCallback, useEffect, useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import { CSVLink } from "react-csv";
import { supabase } from "../../../lib/supabaseClient";

export default function AsignacionGuardias() {
    // Estados
    const [locale, setLocale] = useState('es-ES');
    const [provinciaId, setProvinciaId] = useState("");
    const [tecnicosOrden, setTecnicosOrden] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [tecnicos, setTecnicos] = useState([]);
    const [semanaInicio, setSemanaInicio] = useState(null);
    const [guardias, setGuardias] = useState([]);
    const [mensaje, setMensaje] = useState("");
    const [tecnicoSeleccionadoCambio, setTecnicoSeleccionadoCambio] = useState({});
    const [provinciaSeleccionada, setProvinciaSeleccionada] = useState("");

    // Funciones optimizadas con useCallback
    const cargarProvincias = useCallback(async () => {
        const { data } = await supabase.from('provincias').select('*');
        setProvincias(data || []);
    }, []);

    const cargarTecnicos = useCallback(async () => {
        if (!provinciaId) return;
        const { data } = await supabase
            .from('tecnicos')
            .select('*')
            .eq('provincia_id', provinciaId);
        setTecnicos(data || []);
        setTecnicosOrden(new Array(data?.length || 0).fill(null));
    }, [provinciaId]);

    const cargarGuardias = useCallback(async () => {
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
                .gte('fecha_guardia', fechaInicio.toLocaleDateString('sv'))
                .lte('fecha_guardia', fechaFin.toLocaleDateString('sv'))
                .order('fecha_guardia', { ascending: true });

            if (error) throw error;
            setGuardias(data || []);
        } catch (error) {
            console.error("Error al cargar guardias:", error);
            setMensaje("Error al cargar guardias");
        }
    }, [semanaInicio]);

    // useEffects optimizados
    useEffect(() => {
        const browserLocale = navigator.language;
        setLocale(browserLocale.startsWith('es') ? 'es-ES' : 'en-US');
    }, []);

    useEffect(() => {
        cargarProvincias();
    }, [cargarProvincias]);

    useEffect(() => {
        if (provinciaId) {
            cargarTecnicos();
            cargarGuardias();
        }
    }, [provinciaId, cargarTecnicos, cargarGuardias]);

    useEffect(() => {
        if (semanaInicio) {
            cargarGuardias();
        }
    }, [semanaInicio, cargarGuardias]);

    // Resto de funciones
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
                const fechaGuardia = fecha.toLocaleDateString('sv').split('T')[0];

                nuevasGuardias.push({
                    fecha_guardia: fechaGuardia,
                    tecnico_id: tecnicosOrden[i % tecnicosOrden.length].id,
                    provincia_id: provinciaId,
                    pago: 100
                });
            }

            const { error: deleteError } = await supabase
                .from('guardias')
                .delete()
                .eq('provincia_id', provinciaId)
                .gte('fecha_guardia', fechaInicio.toLocaleDateString('sv'))
                .lte('fecha_guardia', fechaFin.toLocaleDateString('sv'));

            if (deleteError) throw deleteError;

            const { error: insertError } = await supabase
                .from('guardias')
                .insert(nuevasGuardias)
                .select();

            if (insertError) throw insertError;

            setMensaje("Guardias asignadas correctamente");
            await cargarGuardias();
        } catch (error) {
            console.error("Error al asignar guardias:", error);
            setMensaje(`Error al asignar guardias: ${error.message}`);
        }
    };

    const eliminarGuardias = async () => {
        if (!provinciaId) {
            setMensaje("Selecciona una provincia primero");
            return;
        }

        if (!window.confirm('¿Estás seguro de que quieres eliminar todas las guardias de esta provincia?')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('guardias')
                .delete()
                .eq('provincia_id', provinciaId);

            if (error) throw error;

            setMensaje("Guardias eliminadas correctamente");
            setGuardias([]);
            await cargarGuardias();
        } catch (error) {
            console.error("Error al eliminar guardias:", error);
            setMensaje("Error al eliminar las guardias: " + error.message);
        }
    };

    const cambiarTecnico = async (guardiaId, nuevoTecnicoId) => {
        if (!nuevoTecnicoId) {
            setMensaje("Selecciona un nuevo técnico");
            return;
        }

        try {
            const { data: guardiaExistente, error: errorExistente } = await supabase
                .from('guardias')
                .select('id')
                .eq('id', guardiaId)
                .single();

            if (errorExistente || !guardiaExistente) {
                throw new Error('No se encontró la guardia para actualizar');
            }

            const { error } = await supabase
                .from('guardias')
                .update({ tecnico_id: nuevoTecnicoId })
                .eq('id', guardiaId)
                .select();

            if (error) throw error;

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
            const selectedDate = new Date(date);
            setSemanaInicio(selectedDate);
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
        return `${format(inicioSemana, 'MMMM dd, yyyy', { locale: locale === 'es-ES' ? es : enUS })} - ${format(finSemana, 'MMMM dd, yyyy', { locale: locale === 'es-ES' ? es : enUS })}`;
    };

    // El return se mantiene igual que en tu código original...
    // [Todo el JSX que ya tenías]

    // Reemplazar el return con este código actualizado:
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
            <div className="max-w-4xl mx-auto bg-gray-800 rounded-2xl shadow-2xl p-8">
                <h1 className="text-3xl font-bold mb-8 text-white text-center tracking-wide">
                    Asignación de Guardias
                </h1>

                <div className="space-y-6 mb-8">
                    {/* Selector de Provincia */}
                    <div className="group">
                        <select
                            value={provinciaId}
                            onChange={(e) => {
                                setProvinciaId(e.target.value);
                                // Obtener el nombre de la provincia seleccionada
                                const provincia = provincias.find(p => p.id.toString() === e.target.value);
                                setProvinciaSeleccionada(provincia ? provincia.nombre : "");
                            }}
                            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg
         transition-all duration-300 focus:ring-2 focus:ring-red-500 
         focus:border-transparent outline-none hover:bg-gray-600"
                        >
                            <option value="">Selecciona Provincia</option>
                            {provincias.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Calendario */}
                    <div className="calendar-container bg-gray-700 p-4 rounded-lg shadow-lg">
                        <Calendar
                            onChange={handleCalendarClick}
                            value={semanaInicio}
                            locale={locale === 'es-ES' ? es : enUS}
                            className="w-full border-0 bg-transparent"
                        />
                    </div>

                    {/* Orden de Técnicos */}
                    <div className="space-y-4 bg-gray-700 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-white mb-4">
                            Orden de Técnicos
                        </h2>
                        {tecnicos.map((tecnico, index) => (
                            <div key={index} className="flex items-center space-x-3">
                                <span className="text-white font-medium w-8">{index + 1}.</span>
                                <select
                                    value={tecnicosOrden[index]?.id || ""}
                                    onChange={(e) => handleOrdenTecnicosChange(index, parseInt(e.target.value))}
                                    className="flex-1 p-3 bg-gray-600 text-white border border-gray-500 
                                         rounded-lg transition-all duration-300 focus:ring-2 
                                         focus:ring-red-500 focus:border-transparent outline-none
                                         hover:bg-gray-500"
                                >
                                    <option value="">Seleccionar técnico</option>
                                    {tecnicos.map(t => (
                                        <option key={t.id} value={t.id}>{t.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>

                    {/* Botón Asignar */}
                    <button
                        onClick={asignarGuardias}
                        disabled={!provinciaId || !semanaInicio || !isOrdenCompleto()}
                        className="w-full p-4 bg-gradient-to-r from-red-600 to-red-500 text-white 
         rounded-lg font-semibold text-lg transition-all duration-300 
         hover:from-red-500 hover:to-red-400 disabled:from-gray-500 
         disabled:to-gray-400 disabled:cursor-not-allowed transform 
         hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100
         shadow-lg hover:shadow-xl mb-4"
                    >
                        Asignar Guardias
                    </button>

                    <button
                        onClick={eliminarGuardias}
                        disabled={!provinciaId}
                        className="w-full p-4 bg-gradient-to-r from-red-800 to-red-700 text-white 
         rounded-lg font-semibold text-lg transition-all duration-300 
         hover:from-red-700 hover:to-red-600 disabled:from-gray-500 
         disabled:to-gray-400 disabled:cursor-not-allowed transform 
         hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100
         shadow-lg hover:shadow-xl"
                    >
                        {provinciaSeleccionada ? `Eliminar todas las guardias de ${provinciaSeleccionada}` : 'Eliminar todas las guardias'}
                    </button>

                    {/* Mensaje */}
                    {mensaje && (
                        <div className="p-4 bg-gray-700 rounded-lg text-center text-white 
                                  border-l-4 border-red-500 shadow-lg animate-fadeIn">
                            {mensaje}
                        </div>
                    )}
                </div>

                {/* Tabla de Guardias */}
                <div className="overflow-hidden rounded-lg shadow-xl bg-gray-700">
                    <table className="w-full">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="px-6 py-4 text-left text-white">Semana</th>
                                <th className="px-6 py-4 text-left text-white">Provincia</th>
                                <th className="px-6 py-4 text-left text-white">Técnico</th>
                                <th className="px-6 py-4 text-left text-white">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-600">
                            {guardias.map((guardia) => (
                                <tr key={guardia.id || guardia.fecha_guardia}
                                    className="hover:bg-gray-600 transition-colors duration-200">
                                    <td className="px-6 py-4 text-white">
                                        {obtenerSemana(guardia.fecha_guardia)}
                                    </td>
                                    <td className="px-6 py-4 text-white font-medium">
                                        {guardia.provincias?.nombre}
                                    </td>
                                    <td className="px-6 py-4 text-white">
                                        {guardia.tecnicos?.nombre || 'No asignado'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {guardia.provincia_id.toString() === provinciaId.toString() && (
                                            <div className="flex items-center space-x-3">
                                                <select
                                                    value={tecnicoSeleccionadoCambio[guardia.id] || ""}
                                                    onChange={(e) => {
                                                        setTecnicoSeleccionadoCambio(prev => ({
                                                            ...prev,
                                                            [guardia.id]: e.target.value
                                                        }));
                                                    }}
                                                    className="p-2 bg-gray-600 text-white border border-gray-500 
                                                         rounded-lg transition-all duration-300 focus:ring-2 
                                                         focus:ring-blue-500 outline-none hover:bg-gray-500"
                                                >
                                                    <option value="">Seleccionar técnico</option>
                                                    {tecnicos.map((t) => (
                                                        <option key={t.id} value={t.id}>{t.nombre}</option>
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
                                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 
                                                         text-white rounded-lg transition-all duration-300 
                                                         hover:from-blue-500 hover:to-blue-400 
                                                         disabled:from-gray-500 disabled:to-gray-400 
                                                         disabled:cursor-not-allowed transform 
                                                         hover:scale-105 active:scale-95"
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

                {/* Botón Exportar */}
                {guardias.length > 0 && (
                    <div className="mt-6 text-center">
                        <CSVLink
                            data={guardias.map(g => ({
                                semana: obtenerSemana(g.fecha_guardia),
                                tecnico: g.tecnicos?.nombre || 'No asignado',
                                provincia: g.provincias?.nombre
                            }))}
                            filename="guardias.csv"
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r 
                                 from-green-600 to-green-500 text-white rounded-lg 
                                 transition-all duration-300 hover:from-green-500 
                                 hover:to-green-400 transform hover:scale-105 
                                 active:scale-95 shadow-lg hover:shadow-xl"
                        >
                            <span className="mr-2">📊</span>
                            Exportar a CSV
                        </CSVLink>
                    </div>
                )}
            </div>
        </div>
    );
}

