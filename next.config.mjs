const uploadMb = String(
  Math.min(
    Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || process.env.MAX_UPLOAD_MB || 10) || 10,
    10,
  ),
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_MAX_UPLOAD_MB: uploadMb,
  },
  images: {
    unoptimized: true,
  },
  agentRules: false,
  poweredByHeader: false,
  serverExternalPackages: ['pg', 'pg-native'],
}

export default nextConfig
