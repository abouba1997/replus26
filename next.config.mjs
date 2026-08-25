const onVercel = process.env.VERCEL === '1'
const bodyLimit = onVercel ? '4.5mb' : '32mb'
const uploadMb = process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || process.env.MAX_UPLOAD_MB || (onVercel ? '1' : '8')

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
  experimental: {
    serverActions: {
      bodySizeLimit: bodyLimit,
    },
    proxyClientMaxBodySize: bodyLimit,
  },
}

export default nextConfig
