// middleware.js
import { NextResponse } from 'next/server';
import { supabase } from './lib/supabaseClient';

export async function middleware(req) {
    const { pathname } = req.nextUrl;

    // Manejar redirección de idioma primero
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/es-ES', req.url));
    }

    // Comprobar si la ruta requiere autenticación
    if (pathname.startsWith('/real-dashboard') || pathname.startsWith('/demo-dashboard')) {
        console.log('Middleware de autenticación ejecutado');
        const { data: session } = await supabase.auth.getSession();
        const user = session?.user;

        console.log('Ruta solicitada:', pathname);
        console.log('Usuario:', user);

        if (!user) {
            console.log('Redirigiendo a /login');
            return NextResponse.redirect(new URL('/login', req.url));
        }

        const { data: userInfo } = await supabase
            .from('users')
            .select('user_type')
            .eq('email', user.email)
            .single();

        console.log('Información del usuario:', userInfo);

        if (userInfo.user_type === 'demo' && pathname.startsWith('/real-dashboard')) {
            console.log('Redirigiendo a /demo-dashboard');
            return NextResponse.redirect(new URL('/demo-dashboard', req.url));
        }

        if (userInfo.user_type === 'real' && pathname.startsWith('/demo-dashboard')) {
            console.log('Redirigiendo a /real-dashboard');
            return NextResponse.redirect(new URL('/real-dashboard', req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/', // Para redirección inicial
        '/real-dashboard/:path*',
        '/demo-dashboard/:path*'
    ]
};