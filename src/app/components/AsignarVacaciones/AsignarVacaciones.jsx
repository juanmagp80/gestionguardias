import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import { supabase } from "../../../../lib/supabaseClient";

export default function AsignarVacaciones() {
    const [provincias, setProvincias] = useState([]);
    const [tecnicos, setTecnicos] = useState([]);
    const [provinciaId, setProvinciaId] = useState("");
    const [tecnicoId, setTecnicoId] = useState("");
    const [rangoSeleccionado, setRangoSeleccionado] = useState(null);

    useEffect(() => {
        fetchProvincias();
    }, []);

    useEffect(() => {
        if (provinciaId) {
            fetchTecnicos(provinciaId);
        }
    }, [provinciaId]);

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

    const handleRangoSeleccionado = (range) => {
        const [start, end] = range;
        if (start && end) {
            setRangoSeleccionado({
                fecha_inicio: start.toISOString().split("T")[0],
                fecha_fin: end.toISOString().split("T")[0]
            });
        } else {
            setRangoSeleccionado(null);
        }
    };

    const handleAsignarVacaciones = async () => {
        if (!tecnicoId || !rangoSeleccionado) {
            console.error("Selecciona un técnico y un rango de fechas.");
            return;
        }

        // Verificar si ya existen vacaciones para el técnico en el rango seleccionado
        const { data: existingVacaciones, error: fetchError } = await supabase
            .from('vacaciones')
            .select('*')
            .eq('tecnico_id', tecnicoId)
            .gte('fecha_inicio', rangoSeleccionado.fecha_inicio)
            .lte('fecha_fin', rangoSeleccionado.fecha_fin);

        if (fetchError) {
            console.error("Error al verificar vacaciones existentes:", fetchError.message);
            return;
        }

        if (existingVacaciones.length > 0) {
            console.error("Ya existen vacaciones para este técnico en este rango.");
            alert("Ya existen vacaciones asignadas para este técnico en este rango.");
            return;
        }

        // Si no hay conflictos, proceder a insertar
        const { error } = await supabase.from('vacaciones').insert([
            {
                tecnico_id: tecnicoId,
                fecha_inicio: rangoSeleccionado.fecha_inicio,
                fecha_fin: rangoSeleccionado.fecha_fin
            }
        ]);

        if (error) {
            console.error("Error al asignar vacaciones:", error.message);
        } else {
            alert("Vacaciones asignadas correctamente.");
            setRangoSeleccionado(null);
            setTecnicoId("");
            setProvinciaId("");
            setTecnicos([]);
        }
    };

    return (
        <div className="p-6 bg-white shadow-md rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-700">Asignar Vacaciones</h2>

            <div className="mb-4">
                <label className="block text-gray-600 mb-1">Selecciona una Provincia</label>
                <select
                    value={provinciaId}
                    onChange={(e) => setProvinciaId(e.target.value)}
                    className="w-full p-2 border rounded-md"
                >
                    <option value="">Selecciona una provincia</option>
                    {provincias.map((provincia) => (
                        <option key={provincia.id} value={provincia.id}>
                            {provincia.nombre}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-4">
                <label className="block text-gray-600 mb-1">Selecciona un Técnico</label>
                <select
                    value={tecnicoId}
                    onChange={(e) => setTecnicoId(e.target.value)}
                    disabled={!provinciaId}
                    className="w-full p-2 border rounded-md"
                >
                    <option value="">Selecciona un técnico</option>
                    {tecnicos.map((tecnico) => (
                        <option key={tecnico.id} value={tecnico.id}>
                            {tecnico.nombre}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-4">
                <label className="block text-gray-600 mb-1">Selecciona el Rango de Fechas</label>
                <Calendar
                    selectRange={true}
                    onChange={handleRangoSeleccionado}
                    locale="es"
                    className="bg-gray-100 rounded-md"
                />
            </div>

            <button
                onClick={handleAsignarVacaciones}
                className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-150"
            >
                Asignar Vacaciones
            </button>
        </div>
    );
}
