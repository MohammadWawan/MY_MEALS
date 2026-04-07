/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        serverComponentsExternalPackages: ['better-sqlite3'],
        serverActions: {
            bodySizeLimit: '5mb',
        },
    },
};

export default nextConfig;
