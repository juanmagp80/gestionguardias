// middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
    // Obtener la ruta actual
    const { pathname } = request.nextUrl;

    // Si estamos en la raíz, redirigir a es-ES
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/es-ES', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\..*|es-ES).*)']
};