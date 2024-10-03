'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Tu configuración de Supabase

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError(error.message);
        } else {
            const { data: userInfo, error: userError } = await supabase
                .from('users')
                .select('user_type')
                .eq('email', data.user.email)
                .single();

            if (userInfo.user_type === 'demo') {
                router.push('/demo-dashboard'); // Redirige a la página de datos de muestra
            } else {
                router.push('/real-dashboard'); // Redirige a la página de datos reales
            }
        }
    };

    return (
        <div>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Iniciar Sesión</button>
            </form>
            {error && <p>{error}</p>}
        </div>
    );
}
