import { NextResponse } from 'next/server';
import { supabase } from './lib/supabaseClient'; // tu configuración de Supabase

export async function middleware(req) {
    const { data: session } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    const { data: userInfo } = await supabase
        .from('users')
        .select('user_type')
        .eq('email', user.email)
        .single();

    if (userInfo.user_type === 'demo' && req.nextUrl.pathname.startsWith('/real-dashboard')) {
        return NextResponse.redirect(new URL('/demo-dashboard', req.url));
    }

    if (userInfo.user_type === 'real' && req.nextUrl.pathname.startsWith('/demo-dashboard')) {
        return NextResponse.redirect(new URL('/real-dashboard', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/real-dashboard', '/demo-dashboard'],
};
