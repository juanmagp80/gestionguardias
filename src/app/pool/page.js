"use client";

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../../lib/supabaseClient';

export default function Pool() {
    const [provincias, setProvincias] = useState([]);
    const [tecnicos, setTecnicos] = useState([]);
    const [provinciaId, setProvinciaId] = useState('');
    const [showVehiculos, setShowVehiculos] = useState(false);

    useEffect(() => {
        fetchProvincias();
    }, []);

    const fetchProvincias = async () => {
        const { data, error } = await supabase.from('provincias').select('*');
        if (error) {
            console.error('Error fetching provincias:', error.message);
        } else {
            setProvincias(data || []);
        }
    };

    const fetchTecnicos = async () => {
        let query = supabase
            .from('tecnicos')
            .select(showVehiculos ? '*, matriculas(*)' : 'nombre, dni, telefono');

        if (provinciaId) {
            query = query.eq('provincia_id', provinciaId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching tecnicos:', error.message);
        } else {
            setTecnicos(data || []);
        }
    };

    const handleProvinciaChange = (e) => {
        setProvinciaId(e.target.value);
    };

    const handleCheckboxChange = (e) => {
        setShowVehiculos(e.target.checked);
    };

    const handleSearch = () => {
        fetchTecnicos();
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(tecnicos.map(tecnico => {
            const baseData = {
                Nombre: tecnico.nombre,
                DNI: tecnico.dni,
                Telefono: tecnico.telefono,
            };

            if (showVehiculos) {
                return {
                    ...baseData,
                    'Modelo Vehículo': tecnico.matriculas?.map(v => v.modelo).join(', '),
                    'Matrícula': tecnico.matriculas?.map(v => v.matricula).join(', '),
                };
            }

            return baseData;
        }));

        // Ajustar el ancho de las columnas
        ws['!cols'] = [
            { wpx: 150 },  // Ancho para "Nombre"
            { wpx: 100 },  // Ancho para "DNI"
            { wpx: 120 },  // Ancho para "Telefono"
            ...(showVehiculos ? [{ wpx: 150 }, { wpx: 150 }] : [])  // Ancho para "Modelo Vehículo" y "Matrícula" si se muestran
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Técnicos');

        XLSX.writeFile(wb, 'tecnicos.xlsx');
    };


    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Listado de Técnicos</h1>
                <div className="mb-4 flex items-center justify-between">
                    <select
                        value={provinciaId}
                        onChange={handleProvinciaChange}
                        className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">Selecciona una provincia</option>
                        {provincias.map((provincia) => (
                            <option key={provincia.id} value={provincia.id}>
                                {provincia.nombre}
                            </option>
                        ))}
                    </select>
                    <label className="ml-4 flex items-center">
                        <input
                            type="checkbox"
                            checked={showVehiculos}
                            onChange={handleCheckboxChange}
                            className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span className="ml-2 text-gray-700">Mostrar Vehículos</span>
                    </label>
                    <button
                        onClick={handleSearch}
                        className="ml-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        Buscar
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 border-b-2 border-gray-300 w-1/4">Nombre</th>
                                <th className="px-4 py-2 border-b-2 border-gray-300 w-1/4">DNI</th>
                                <th className="px-4 py-2 border-b-2 border-gray-300 w-1/4">Teléfono</th>
                                {showVehiculos && (
                                    <>
                                        <th className="px-4 py-2 border-b-2 border-gray-300 w-1/4">Modelo Vehículo</th>
                                        <th className="px-4 py-2 border-b-2 border-gray-300 w-1/4">Matrícula</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {tecnicos.map((tecnico) => (
                                <tr key={tecnico.id}>
                                    <td className="px-4 py-2 border-b w-1/4">{tecnico.nombre}</td>
                                    <td className="px-4 py-2 border-b w-1/4">{tecnico.dni}</td>
                                    <td className="px-4 py-2 border-b w-1/4">{tecnico.telefono}</td>
                                    {showVehiculos && (
                                        <>
                                            <td className="px-4 py-2 border-b w-1/4">
                                                {tecnico.matriculas?.map((vehiculo) => vehiculo.modelo).join(', ')}
                                            </td>
                                            <td className="px-4 py-2 border-b w-1/4">
                                                {tecnico.matriculas?.map((vehiculo) => vehiculo.matricula).join(', ')}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="text-center mt-6">
                    <button
                        onClick={exportToExcel}
                        className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                        Exportar a Excel
                    </button>
                </div>
            </div>
        </div>
    );
}
