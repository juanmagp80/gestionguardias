"use client"; // Añade esta línea al principio del archivo

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import './Dashboard.css'; // Asegúrate de que el archivo CSS esté en el mismo directorio

export default function RealDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Obtener el usuario autenticado
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) {
                setError(error);
            } else {
                setUser(user);
            }
            setLoading(false);
        };

        fetchUser();
    }, []);

    // Manejar el cierre de sesión
    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login'); // Redirige a la página de login
    };

    // Manejar errores y estado de carga
    if (loading) {
        return <div className="loader">Cargando...</div>;
    }

    if (error || !user) {
        return (
            <div className="container">
                <h1>Error: Usuario no autenticado</h1>
            </div>
        );
    }

    // Renderizar la página
    return (
        <div className="container">
            <header className="header">
                <h1>Dashboard</h1>
                <button className="logout-button" onClick={handleLogout}>Cerrar sesión</button>
            </header>
            <main className="main-content">
                {/* Aquí puedes añadir componentes o secciones adicionales */}
                <p>No se mostrarán datos en esta página.</p>
            </main>
        </div>
    );
}
