"use client"
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function Provincias() {
    const [provincias, setProvincias] = useState([]);
    const [nombre, setNombre] = useState('');

    useEffect(() => {
        fetchProvincias();
    }, []);

    const fetchProvincias = async () => {
        const { data, error } = await supabase.from('provincias').select('*');
        if (error) {
            console.error(error);
        } else {
            setProvincias(data || []);  // Aseguramos que data sea un arreglo vacío si no hay resultados
        }
    };

    const handleAddProvincia = async () => {
        const { data, error } = await supabase
            .from('provincias')
            .insert([{ nombre }]);

        if (error) {
            console.error(error);
        } else {
            setProvincias([...provincias, ...(data || [])]);  // Aseguramos que data sea un arreglo vacío si no hay resultados
            setNombre('');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Gestión de Provincias</h1>
                <div className="mb-4">
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Nombre de la provincia"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>
                <div className="text-center mb-6">
                    <button
                        onClick={handleAddProvincia}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        Agregar Provincia
                    </button>
                </div>
                <ul className="space-y-2">
                    {provincias.map((provincia) => (
                        <li key={provincia.id} className="bg-gray-200 p-4 rounded-lg shadow-sm">
                            {provincia.nombre}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}