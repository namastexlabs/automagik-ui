/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    ppr: true,
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
};

export default nextConfig;
