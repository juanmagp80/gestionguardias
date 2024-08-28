"use client"
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function Tecnicos() {
    const [tecnicos, setTecnicos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [nombre, setNombre] = useState('');
    const [provinciaId, setProvinciaId] = useState('');

    useEffect(() => {
        fetchTecnicos();
        fetchProvincias();
    }, []);

    const fetchTecnicos = async () => {
        const { data, error } = await supabase
            .from('tecnicos')
            .select('*, provincias(nombre)')
            .order('nombre', { ascending: true });

        if (error) {
            console.error(error);
        } else {
            setTecnicos(data || []);  // Asegurar que data sea un array
        }
    };

    const fetchProvincias = async () => {
        const { data, error } = await supabase.from('provincias').select('*');
        if (error) {
            console.error(error);
        } else {
            setProvincias(data || []);  // Asegurar que data sea un array
        }
    };

    const handleAddTecnico = async () => {
        const { data, error } = await supabase
            .from('tecnicos')
            .insert([{ nombre, provincia_id: provinciaId }]);

        if (error) {
            console.error(error);
        } else {
            setTecnicos([...tecnicos, ...(data || [])]);  // Asegurar que data sea un array
            setNombre('');
            setProvinciaId('');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Gestión de Técnicos</h1>
                <div className="mb-4">
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Nombre del técnico"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>
                <div className="mb-4">
                    <select
                        value={provinciaId}
                        onChange={(e) => setProvinciaId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">Selecciona una provincia</option>
                        {provincias.map((provincia) => (
                            <option key={provincia.id} value={provincia.id}>
                                {provincia.nombre}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="text-center mb-6">
                    <button
                        onClick={handleAddTecnico}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        Agregar Técnico
                    </button>
                </div>
                <ul className="space-y-2">
                    {tecnicos.map((tecnico) => (
                        <li key={tecnico.id} className="bg-gray-200 p-4 rounded-lg shadow-sm">
                            {tecnico.nombre} - {tecnico.provincias.nombre}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}