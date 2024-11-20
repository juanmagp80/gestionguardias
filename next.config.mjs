/** @type {import('next').NextConfig} */
const nextConfig = {
    i18n: {
        locales: ['en-US', 'es-ES'],
        defaultLocale: 'es-ES',
    },
    reactStrictMode: true,

    // Configurar compilación
    swcMinify: true,

    // Configurar salida estática si es necesario
    output: 'standalone',

    // Configurar dominio de imágenes si se usan
    images: {
        domains: ['localhost'],
        unoptimized: true
    }
};

export default nextConfig;