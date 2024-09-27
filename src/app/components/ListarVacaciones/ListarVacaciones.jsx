import { useEffect, useState } from "react";
import * as XLSX from 'xlsx';
import { supabase } from "../../../../lib/supabaseClient";

export default function ListarVacaciones() {
    const [provincias, setProvincias] = useState([]);
    const [tecnicos, setTecnicos] = useState([]);
    const [provinciaId, setProvinciaId] = useState("");
    const [vacaciones, setVacaciones] = useState([]);
    const [vacacionSeleccionada, setVacacionSeleccionada] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [nuevasFechas, setNuevasFechas] = useState({ fecha_inicio: "", fecha_fin: "" });

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

    const handleEditar = (vacacion) => {
        setVacacionSeleccionada(vacacion);
        setNuevasFechas({
            fecha_inicio: vacacion.fecha_inicio,
            fecha_fin: vacacion.fecha_fin,
        });
        setModalOpen(true);
    };

    const handleEliminar = async (vacacionId) => {
        const { error } = await supabase
            .from('vacaciones')
            .delete()
            .eq('id', vacacionId);

        if (error) {
            console.error("Error al eliminar la vacación:", error.message);
        } else {
            alert("Vacación eliminada correctamente.");
            fetchVacaciones();
        }
    };

    const handleGuardarCambios = async () => {
        const { error } = await supabase
            .from('vacaciones')
            .update({
                fecha_inicio: nuevasFechas.fecha_inicio,
                fecha_fin: nuevasFechas.fecha_fin,
            })
            .eq('id', vacacionSeleccionada.id);

        if (error) {
            console.error("Error al guardar cambios:", error.message);
        } else {
            alert("Vacación actualizada correctamente.");
            setModalOpen(false);
            setVacacionSeleccionada(null);
            fetchVacaciones();
        }
    };

    return (
        <div className="p-6 bg-white shadow-md rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-700">Consultar Vacaciones</h2>

            <div className="mb-4">
                <label className="block text-gray-600 mb-1">Selecciona una Provincia</label>
                <select
                    value={provinciaId}
                    onChange={(e) => setProvinciaId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                        <tr className="bg-gray-100">
                            <th className="px-4 py-2 border-b">Técnico</th>
                            <th className="px-4 py-2 border-b">Fecha de Inicio</th>
                            <th className="px-4 py-2 border-b">Fecha de Fin</th>
                            <th className="px-4 py-2 border-b">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vacaciones.length > 0 ? (
                            vacaciones.map((vacacion) => (
                                <tr key={vacacion.id}>
                                    <td className="px-4 py-2 border-b">{vacacion.tecnicos.nombre}</td>
                                    <td className="px-4 py-2 border-b">{vacacion.fecha_inicio}</td>
                                    <td className="px-4 py-2 border-b">{vacacion.fecha_fin}</td>
                                    <td className="px-4 py-2 border-b flex space-x-2">
                                        <button
                                            onClick={() => handleEditar(vacacion)}
                                            className="bg-yellow-500 text-white px-4 py-1 rounded-md hover:bg-yellow-600 transition duration-150"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleEliminar(vacacion.id)}
                                            className="bg-red-500 text-white px-4 py-1 rounded-md hover:bg-red-600 transition duration-150"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-4 py-2 text-center text-gray-500">
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

            {/* Modal para editar vacaciones */}
            {modalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-md w-1/3">
                        <h3 className="text-lg font-semibold mb-2">Editar Vacación</h3>
                        <div className="mb-4">
                            <label className="block text-gray-600 mb-1">Fecha de Inicio</label>
                            <input
                                type="date"
                                value={nuevasFechas.fecha_inicio}
                                onChange={(e) => setNuevasFechas({ ...nuevasFechas, fecha_inicio: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-600 mb-1">Fecha de Fin</label>
                            <input
                                type="date"
                                value={nuevasFechas.fecha_fin}
                                onChange={(e) => setNuevasFechas({ ...nuevasFechas, fecha_fin: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={handleGuardarCambios}
                                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-150"
                            >
                                Guardar Cambios
                            </button>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-150"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
