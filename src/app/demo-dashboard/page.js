import { redirect } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default async function DemoDashboard() {
    // Obtener el usuario autenticado desde Supabase
    const { data: { user } } = await supabase.auth.getUser();

    // Si no hay usuario autenticado, redirige al login
    if (!user) {
        redirect('/login');
    }

    // Verificar el tipo de usuario en la tabla "users"
    const { data: userInfo } = await supabase
        .from('users')
        .select('user_type')
        .eq('email', user.email)
        .single();

    // Si el usuario no es de tipo 'demo', redirige al dashboard real
    if (userInfo.user_type !== 'demo') {
        redirect('/real-dashboard');
    }

    return (
        <div>
            <h1>Dashboard de Datos de Muestra</h1>
            {/* Aquí puedes renderizar más información específica del usuario demo */}
        </div>
    );
}
