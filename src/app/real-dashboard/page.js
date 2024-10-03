import { supabase } from '../../lib/supabaseClient';

export default async function RealDashboard() {
    // Obtener el usuario
    const { data: { user } } = await supabase.auth.getUser();

    // Consultar datos según el tipo de usuario
    const { data } = await supabase
        .from(user.user_type === 'demo' ? 'demo_data' : 'real_data')
        .select('*');

    return (
        <div>
            <h1>Dashboard de Datos Reales</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}
