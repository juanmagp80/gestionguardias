import { useEffect, useState } from "react";
import * as XLSX from 'xlsx';
import { supabase } from "../../../../lib/supabaseClient";

export default function ListarVacaciones() {
    const [provincias, setProvincias] = useState([]);
    const [tecnicos, setTecnicos] = useState([]);
    const [provinciaId, setProvinciaId] = useState("");
    const [vacaciones, setVacaciones] = useState([]);

    useEffect(() => {
        fetchProvincias();
    }, []);

    useEffect(() => {
        if (provinciaId) {
            fetchTecnicos(provinciaId);
        }
    }, [provinciaId]);

    useEffect(() => {
        if (provinciaId) {
            fetchVacaciones();
        }
    }, [provinciaId, tecnicos]);

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

    const fetchVacaciones = async () => {
        const { data, error } = await supabase
            .from("vacaciones")
            .select("*, tecnicos(nombre)")
            .in("tecnico_id", tecnicos.map(t => t.id))
            .order('fecha_inicio', { ascending: true });

        if (error) {
            console.error("Error al cargar vacaciones:", error.message);
        } else {
            // Aquí se asegura que no haya ajustes de zona horaria
            const adjustedVacaciones = data.map(v => ({
                ...v,
                fecha_inicio: new Date(v.fecha_inicio).toISOString().split('T')[0],
                fecha_fin: new Date(v.fecha_fin).toISOString().split('T')[0],
            }));
            setVacaciones(adjustedVacaciones);
        }
    };

    const exportarExcel = () => {
        const ws = XLSX.utils.json_to_sheet(vacaciones.map(v => ({
            "Técnico": v.tecnicos.nombre,
            "Fecha de Inicio": v.fecha_inicio,
            "Fecha de Fin": v.fecha_fin
        })));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Vacaciones");
        XLSX.writeFile(wb, "Vacaciones.xlsx");
    };

    return (
        <div className="p-6 bg-white shadow-md rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-700">Consultar Vacaciones</h2>

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

            <h3 className="text-xl font-semibold mb-4 text-gray-600">Vacaciones Asignadas</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-sm">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 border-b">Técnico</th>
                            <th className="px-4 py-2 border-b">Fecha de Inicio</th>
                            <th className="px-4 py-2 border-b">Fecha de Fin</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vacaciones.length > 0 ? (
                            vacaciones.map((vacacion) => (
                                <tr key={vacacion.id}>
                                    <td className="px-4 py-2 border-b">{vacacion.tecnicos.nombre}</td>
                                    <td className="px-4 py-2 border-b">{vacacion.fecha_inicio}</td>
                                    <td className="px-4 py-2 border-b">{vacacion.fecha_fin}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="px-4 py-2 text-center text-gray-500">
                                    No hay vacaciones asignadas en esta provincia.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <button
                onClick={exportarExcel}
                className="mt-4 w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition duration-150"
            >
                Exportar a Excel
            </button>
        </div>
    );
}
