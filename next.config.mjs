/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        // Any Supabase project storage (avatars, covers, inline images)
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "www.google.com",
      },
    ],
  },

  reactCompiler: true,
};

export default nextConfig;
