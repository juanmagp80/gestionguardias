import { redirect } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export async function getServerSideProps() {
    const { user } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: userInfo } = await supabase
        .from('users')
        .select('user_type')
        .eq('email', user.email)
        .single();

    if (userInfo.user_type !== 'demo') {
        redirect('/real-dashboard');
    }

    return { props: {} };
}

export default function DemoDashboard() {
    return <div>Dashboard de Datos de Muestra</div>;
}
