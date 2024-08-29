"use client";
import { es } from 'date-fns/locale'; // Importar locale en español
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css'; // Importar estilos del calendario
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
        const { inicio, fin } = semanaSeleccionada;
        const fechaActual = new Date();
        const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1).toISOString().split("T")[0];
        const ultimoDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0).toISOString().split("T")[0];

        try {
            // Recuperar todas las guardias para el periodo seleccionado
            const { data: guardiasData, error: guardiasError } = await supabase
                .from('guardias')
                .select(`
                    fecha_guardia,
                    tecnico_id,
                    tecnicos (nombre, provincia_id),
                    provincias (nombre)
                `)
                .gte('fecha_guardia', inicio)
                .lte('fecha_guardia', fin)
                .order('fecha_guardia', { ascending: true });

            if (guardiasError) {
                throw guardiasError;
            }

            // Recuperar todas las guardias del mes actual para contar
            const { data: guardiasMesData, error: guardiasMesError } = await supabase
                .from('guardias')
                .select('tecnico_id')
                .gte('fecha_guardia', primerDiaMes)
                .lte('fecha_guardia', ultimoDiaMes);

            if (guardiasMesError) {
                throw guardiasMesError;
            }

            // Contar la cantidad de guardias por técnico en el mes actual
            const conteoMesActual = guardiasMesData.reduce((acc, { tecnico_id }) => {
                acc[tecnico_id] = (acc[tecnico_id] || 0) + 1;
                return acc;
            }, {});

            // Procesar los datos
            const processedData = guardiasData.map(guardia => {
                const tecnico = guardia.tecnicos || {};
                const provincia = guardia.provincias || {};
                return {
                    fecha_guardia: guardia.fecha_guardia,
                    tecnico_nombre: tecnico.nombre ? tecnico.nombre.trim() : "N/A",
                    provincia_nombre: provincia.nombre ? provincia.nombre.trim() : "N/A",
                    countMesActual: conteoMesActual[guardia.tecnico_id] || 0 // Guardias del mes actual
                };
            });

            setGuardias(processedData);
        } catch (error) {
            console.error("Error al recuperar guardias:", error.message);
        }
    };



    useEffect(() => {
        if (guardias.length > 0) {
            setCsvData(
                guardias.map(guardia => ({
                    fecha_guardia: guardia.fecha_guardia,
                    tecnico: guardia.tecnico_nombre,
                    provincia: guardia.provincia_nombre
                }))
            );
        }
    }, [guardias]);

    const calcularSemanaDesdeLunes = (lunes) => {
        const fechaInicio = new Date(lunes);
        fechaInicio.setDate(fechaInicio.getDate() - (fechaInicio.getDay() - 1)); // Ajustar al lunes de la semana
        fechaInicio.setHours(0, 0, 0, 0); // Establecer la hora en 00:00:00

        const fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaFin.getDate() + 6); // Fin de semana (domingo)

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

    const handleAsignarGuardias = async () => {
        if (!tecnicoId || !semanaSeleccionada) {
            console.error("Selecciona un técnico y una semana antes de asignar guardias.");
            return;
        }

        // Convertir tecnicoId a número y eliminar espacios en blanco
        const tecnicoIdNum = parseInt(tecnicoId.trim(), 10);

        // Obtener el técnico seleccionado para obtener su provincia_id
        const tecnicoSeleccionado = tecnicos.find(tecnico => tecnico.id === tecnicoIdNum);
        console.log("Técnico ID seleccionado:", tecnicoIdNum);
        console.log("Lista de técnicos:", tecnicos);

        if (!tecnicoSeleccionado) {
            console.error("Técnico no encontrado.");
            return;
        }

        const { provincia_id } = tecnicoSeleccionado;
        const { inicio } = semanaSeleccionada;
        const fechasGuardias = [];

        for (let i = 0; i < 7; i++) {
            const fecha = new Date(inicio);
            fecha.setDate(fecha.getDate() + i);
            if (fecha.getDay() === 6) { // Solo insertar los sábados
                fechasGuardias.push({
                    tecnico_id: tecnicoIdNum,
                    provincia_id: provincia_id, // Incluir provincia_id
                    fecha_guardia: fecha.toISOString().split("T")[0],
                    pago: 100, // Ejemplo: $100 por guardia
                });
            }
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
            setSemanaSeleccionada(null); // Resetear la selección después de guardar
        } catch (error) {
            console.error("Error al asignar guardias:", error.message);
        }
    };

    const tileClassName = ({ date, view }) => {
        if (view === 'month' && semanaSeleccionada) {
            const fecha = new Date(date);
            const inicioSemana = new Date(semanaSeleccionada.inicio);
            const finSemana = new Date(semanaSeleccionada.fin);

            if (fecha >= inicioSemana && fecha <= finSemana) {
                return 'bg-blue-500 text-white rounded-lg shadow-md'; // Cambiar estilos
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
                    onClick={handleAsignarGuardias}
                    className="bg-red-500 text-white   text-white px-6 py-3 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    Asignar Guardias
                </button>
            </div>
            <div className="text-center mt-4 bg-gray-300">
                <h2 className="text-xl font-semibold text-center text-white mt-8 mb-4">Guardias Asignadas</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-sm">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 border-b">Fecha</th>
                                <th className="px-4 py-2 border-b">Técnico</th>
                                <th className="px-4 py-2 border-b">Provincia</th>
                                <th className="px-4 py-2 border-b">Guardias en el Mes</th> {/* Nueva columna */}
                            </tr>
                        </thead>
                        <tbody>
                            {guardias.map((guardia, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2 border-b">{guardia.fecha_guardia}</td>
                                    <td className="px-4 py-2 border-b">{guardia.tecnico_nombre}</td>
                                    <td className="px-4 py-2 border-b">{guardia.provincia_nombre}</td>
                                    <td className="px-4 py-2 border-b">{guardia.countMesActual}</td> {/* Mostrar guardias del mes */}
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