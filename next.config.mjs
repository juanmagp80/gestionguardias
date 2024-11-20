/** @type {import('next').NextConfig} */
const nextConfig = {
    // Configuración para App Router con internacionalización
    experimental: {
        appDir: true
    },
    // Eliminar i18n antiguo y usar middleware para idiomas
    async redirects() {
        return [
            {
                source: '/',
                destination: '/es-ES',
                permanent: true,
            },
        ];
    },
    reactStrictMode: true,
    swcMinify: true,
    output: 'standalone',
    images: {
        domains: ['localhost'],
        unoptimized: true
    }
};

export default nextConfig;