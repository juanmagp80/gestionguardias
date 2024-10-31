"use client";
import { es } from 'date-fns/locale';
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import { CSVLink } from "react-csv";
import { supabase } from "../../../lib/supabaseClient";

export default function Guardias() {
    const [provincias, setProvincias] = useState([]);
    const [tecnicos, setTecnicos] = useState([]);
    const [provinciaId, setProvinciaId] = useState("");
    const [tecnicoId, setTecnicoId] = useState("");
    const [guardias, setGuardias] = useState([]);
    const [semanaSeleccionada, setSemanaSeleccionada] = useState(null);
    const [csvData, setCsvData] = useState([]);
    const [mensajeConfirmacion, setMensajeConfirmacion] = useState("");
    const [nuevoTecnicoId, setNuevoTecnicoId] = useState("");

    useEffect(() => {
        fetchProvincias();
    }, []);

    useEffect(() => {
        if (provinciaId) {
            fetchTecnicos(provinciaId);
        }
    }, [provinciaId]);

    useEffect(() => {
        if (semanaSeleccionada) {
            fetchGuardias();
        }
    }, [semanaSeleccionada]);

    const fetchProvincias = async () => {
        const { data, error } = await supabase.from("provincias").select("*");
        if (error) {
            console.error("Error al cargar provincias:", error.message);
        } else {
            setProvincias(data);
        }
    };

    const fetchTecnicos = async (provinciaId) => {
        const { data, error } = await supabase
            .from("tecnicos")
            .select("*")
            .eq("provincia_id", provinciaId);

        if (error) {
            console.error("Error al cargar técnicos:", error.message);
        } else {
            setTecnicos(data);
        }
    };

    const fetchGuardias = async () => {
        if (!semanaSeleccionada) return;

        const { inicio, fin } = semanaSeleccionada;

        try {
            const { data: guardiasData, error } = await supabase
                .from('guardias')
                .select(`
                    fecha_guardia,
                    tecnico_id,
                    tecnicos (nombre),
                    provincias (nombre)
                `)
                .gte('fecha_guardia', inicio)
                .lte('fecha_guardia', fin)
                .order('fecha_guardia', { ascending: true });

            if (error) {
                throw error;
            }

            const processedData = guardiasData.map(guardia => {
                const tecnico = guardia.tecnicos || {};
                const provincia = guardia.provincias || {};
                return {
                    fecha_guardia: guardia.fecha_guardia,
                    tecnico_nombre: tecnico.nombre ? tecnico.nombre.trim() : "N/A",
                    provincia_nombre: provincia.nombre ? provincia.nombre.trim() : "N/A",
                };
            });

            setGuardias(processedData);
        } catch (error) {
            console.error("Error al recuperar guardias:", error.message);
        }
    };

    const calcularSemanaDesdeLunes = (lunes) => {
        const fechaInicio = new Date(lunes);
        fechaInicio.setDate(fechaInicio.getDate() - (fechaInicio.getDay() - 1));
        fechaInicio.setHours(0, 0, 0, 0);

        const fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaFin.getDate() + 6);

        return {
            inicio: fechaInicio.toISOString().split("T")[0],
            fin: fechaFin.toISOString().split("T")[0],
        };
    };

    const handleDayClick = (date) => {
        if (date.getDay() === 1) {
            const semana = calcularSemanaDesdeLunes(date);
            setSemanaSeleccionada(semana);
        } else {
            setSemanaSeleccionada(null);
        }
    };

    const asignarGuardiasAutomaticamente = async () => {
        if (!tecnicoId || !semanaSeleccionada) {
            console.error("Selecciona un técnico y una semana antes de asignar guardias.");
            return;
        }

        const { inicio } = semanaSeleccionada;
        const fechaInicio = new Date(inicio);

        const tecnicosDisponibles = tecnicos.map(tecnico => tecnico.id);
        const totalSemanas = 12; // 3 meses
        const fechasGuardias = [];

        for (let semana = 0; semana < totalSemanas; semana++) {
            const tecnicoIdActual = tecnicosDisponibles[(semana % tecnicosDisponibles.length)];
            const fechaGuardia = new Date(fechaInicio);
            fechaGuardia.setDate(fechaGuardia.getDate() + (semana * 7));

            fechasGuardias.push({
                tecnico_id: tecnicoIdActual,
                provincia_id: provinciaId,
                fecha_guardia: fechaGuardia.toISOString().split("T")[0],
                pago: 100,
            });
        }

        try {
            const { data, error } = await supabase
                .from("guardias")
                .insert(fechasGuardias);

            if (error) {
                throw error;
            }

            console.log("Guardias asignadas correctamente:", data);
            setGuardias([...guardias, ...(data || [])]);
            setMensajeConfirmacion("Guardias asignadas correctamente.");
            setTimeout(() => {
                setMensajeConfirmacion("");
            }, 3000);
            setSemanaSeleccionada(null);
        } catch (error) {
            console.error("Error al asignar guardias:", error.message);
        }
    };

    const handleCambiarTecnico = async (fechaGuardia) => {
        if (!nuevoTecnicoId) {
            console.error("Selecciona un nuevo técnico antes de cambiar.");
            return;
        }

        try {
            const { data, error } = await supabase
                .from("guardias")
                .update({ tecnico_id: nuevoTecnicoId })
                .eq('fecha_guardia', fechaGuardia)
                .eq('provincia_id', provinciaId);

            if (error) {
                throw error;
            }

            console.log("Técnico cambiado correctamente:", data);
            setMensajeConfirmacion("Técnico cambiado correctamente.");
            setTimeout(() => {
                setMensajeConfirmacion("");
            }, 3000);
            fetchGuardias(); // Actualiza la lista de guardias
        } catch (error) {
            console.error("Error al cambiar técnico:", error.message);
        }
    };

    const tileClassName = ({ date, view }) => {
        if (view === 'month' && semanaSeleccionada) {
            const fecha = new Date(date);
            const inicioSemana = new Date(semanaSeleccionada.inicio);
            const finSemana = new Date(semanaSeleccionada.fin);

            if (fecha >= inicioSemana && fecha <= finSemana) {
                return 'bg-blue-500 text-white rounded-lg shadow-md';
            }
        }
        return null;
    };

    const headers = [
        { label: "Fecha", key: "fecha_guardia" },
        { label: "Técnico", key: "tecnico" },
        { label: "Provincia", key: "provincia" }
    ];

    return (
        <div className="p-6 min-h-screen">
            <h1 className="text-2xl text-white font-semibold text-center mb-6">Asignar Guardias</h1>

            <select
                value={provinciaId}
                onChange={(e) => setProvinciaId(e.target.value)}
                className="block w-full max-w-xs mx-auto mb-4 px-4 py-2 border border-gray-300 rounded-lg"
            >
                <option value="">Selecciona una provincia</option>
                {provincias.map((provincia) => (
                    <option key={provincia.id} value={provincia.id}>
                        {provincia.nombre}
                    </option>
                ))}
            </select>

            <select
                value={tecnicoId}
                onChange={(e) => setTecnicoId(e.target.value)}
                disabled={!provinciaId}
                className="block w-full max-w-xs mx-auto mb-4 px-4 py-2 border border-gray-300 rounded-lg"
            >
                <option value="">Selecciona un técnico</option>
                {tecnicos.map((tecnico) => (
                    <option key={tecnico.id} value={tecnico.id}>
                        {tecnico.nombre}
                    </option>
                ))}
            </select>

            <div className="max-w-md mx-auto mb-6">
                <Calendar
                    value={semanaSeleccionada ? new Date(semanaSeleccionada.inicio) : new Date()}
                    onClickDay={handleDayClick}
                    tileClassName={tileClassName}
                    locale={es}
                    showNeighboringMonth={false}
                    minDetail="month"
                    className="react-calendar bg-gray-200 shadow-lg rounded-lg border border-gray-300"
                />
            </div>

            <div className="text-center">
                <button
                    onClick={asignarGuardiasAutomaticamente}
                    className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    Asignar Guardias
                </button>
            </div>

            {mensajeConfirmacion && (
                <div className="mt-4 text-center text-green-600">{mensajeConfirmacion}</div>
            )}

            <div className="text-center mt-4 bg-gray-300">
                <h2 className="text-xl font-semibold text-center text-white mt-8 mb-4">Guardias Asignadas</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-sm">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 border-b">Fecha</th>
                                <th className="px-4 py-2 border-b">Técnico</th>
                                <th className="px-4 py-2 border-b">Provincia</th>
                                <th className="px-4 py-2 border-b">Cambiar Técnico</th>
                            </tr>
                        </thead>
                        <tbody>
                            {guardias.map((guardia, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2 border-b">{guardia.fecha_guardia}</td>
                                    <td className="px-4 py-2 border-b">{guardia.tecnico_nombre}</td>
                                    <td className="px-4 py-2 border-b">{guardia.provincia_nombre}</td>
                                    <td className="px-4 py-2 border-b">
                                        <select
                                            value={nuevoTecnicoId}
                                            onChange={(e) => setNuevoTecnicoId(e.target.value)}
                                            className="border border-gray-300 rounded-lg"
                                        >
                                            <option value="">Selecciona un nuevo técnico</option>
                                            {tecnicos.map((tecnico) => (
                                                <option key={tecnico.id} value={tecnico.id}>
                                                    {tecnico.nombre}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => handleCambiarTecnico(guardia.fecha_guardia)}
                                            className="ml-2 bg-blue-500 text-white px-2 py-1 rounded-lg"
                                        >
                                            Cambiar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 text-center">
                    <CSVLink
                        data={csvData}
                        headers={headers}
                        filename={"guardias.csv"}
                        className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600"
                    >
                        Exportar a CSV
                    </CSVLink>
                </div>
            </div>
        </div>
    );
}
