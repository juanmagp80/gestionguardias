"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function Matriculas() {
    const [tecnicos, setTecnicos] = useState([]);
    const [tecnicoId, setTecnicoId] = useState("");
    const [modelo, setModelo] = useState("");
    const [matricula, setMatricula] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [editMode, setEditMode] = useState(false); // Nuevo estado
    const [matriculaId, setMatriculaId] = useState(null); // Nuevo estado

    useEffect(() => {
        fetchTecnicos();
    }, []);

    useEffect(() => {
        if (tecnicoId) {
            fetchMatricula(tecnicoId);
        }
    }, [tecnicoId]);

    const fetchTecnicos = async () => {
        const { data, error } = await supabase.from("tecnicos").select("*");
        if (error) {
            console.error("Error al cargar técnicos:", error.message);
        } else {
            setTecnicos(data);
        }
    };

    const fetchMatricula = async (tecnicoId) => {
        const { data, error } = await supabase
            .from("matriculas")
            .select("*")
            .eq("tecnico_id", tecnicoId)
            .single();

        if (error) {
            console.error("Error al cargar la matrícula:", error.message);
            setMensaje("No se encontró una matrícula para este técnico.");
            setEditMode(false);
            setModelo("");
            setMatricula("");
            setMatriculaId(null);
        } else {
            setEditMode(true);
            setModelo(data.modelo);
            setMatricula(data.matricula);
            setMatriculaId(data.id);
            setMensaje("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!tecnicoId || !modelo || !matricula) {
            setMensaje("Por favor, complete todos los campos.");
            return;
        }

        if (editMode) {
            // Editar matrícula existente
            const { data, error } = await supabase
                .from("matriculas")
                .update({
                    modelo: modelo.trim(),
                    matricula: matricula.trim(),
                })
                .eq("id", matriculaId);

            if (error) {
                console.error("Error al actualizar matrícula:", error.message);
                setMensaje("Error al actualizar la matrícula.");
            } else {
                setMensaje("Matrícula actualizada correctamente.");
                resetForm();
            }
        } else {
            // Insertar nueva matrícula
            const { data, error } = await supabase.from("matriculas").insert({
                modelo: modelo.trim(),
                matricula: matricula.trim(),
                tecnico_id: parseInt(tecnicoId, 10),
            });

            if (error) {
                console.error("Error al insertar matrícula:", error.message);
                setMensaje("Error al insertar la matrícula.");
            } else {
                setMensaje("Matrícula añadida correctamente.");
                resetForm();
            }
        }
    };

    const resetForm = () => {
        setModelo("");
        setMatricula("");
        setTecnicoId("");
        setEditMode(false);
        setMatriculaId(null);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('/ruta/a/tu/fondo.jpg')" }}>
            <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-lg max-w-md w-full">
                <h1 className="text-3xl font-bold mb-6 text-gray-900 text-center">
                    {editMode ? "Editar Matrícula de Vehículo" : "Añadir Matrícula de Vehículo"}
                </h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="tecnico" className="block text-lg font-medium text-gray-700">
                            Técnico
                        </label>
                        <select
                            id="tecnico"
                            value={tecnicoId}
                            onChange={(e) => setTecnicoId(e.target.value)}
                            className="mt-1 block w-full py-3 px-4 border border-gray-300 bg-white bg-opacity-80 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        >
                            <option value="">Selecciona un técnico</option>
                            {tecnicos.map((tecnico) => (
                                <option key={tecnico.id} value={tecnico.id}>
                                    {tecnico.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="modelo" className="block text-lg font-medium text-gray-700">
                            Modelo del Vehículo
                        </label>
                        <input
                            type="text"
                            id="modelo"
                            value={modelo}
                            onChange={(e) => setModelo(e.target.value)}
                            className="mt-1 block w-full py-3 px-4 border border-gray-300 bg-white bg-opacity-80 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="matricula" className="block text-lg font-medium text-gray-700">
                            Matrícula
                        </label>
                        <input
                            type="text"
                            id="matricula"
                            value={matricula}
                            onChange={(e) => setMatricula(e.target.value)}
                            className="mt-1 block w-full py-3 px-4 border border-gray-300 bg-white bg-opacity-80 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                            required
                        />
                    </div>
                    {mensaje && <p className="text-center text-red-600">{mensaje}</p>}
                    <div className="text-center">
                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                        >
                            {editMode ? "Actualizar Matrícula" : "Añadir Matrícula"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
