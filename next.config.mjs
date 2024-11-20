// next.config.js
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    output: 'standalone',
    images: {
        domains: ['localhost'],
        unoptimized: true
    }
};

export default nextConfig;