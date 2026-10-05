import type { NextConfig } from 'next';

/**
 * Trusted remote origins for the Next.js image optimizer.
 *
 * SEC-01: an open `hostname: '**'` wildcard allowed the optimizer to fetch any
 * host reachable from the server, which is a server-side request forgery (SSRF)
 * primitive against internal ranges (169.254.169.254, 10.0.0.0/8, localhost) and
 * an open proxy. The allowlist below is the only set of origins the catalogue
 * actually serves from.
 */
const TRUSTED_IMAGE_ORIGINS = [
  {
    protocol: 'https' as const,
    hostname: 'images.unsplash.com',
    port: '',
    pathname: '/**',
  },
];

/**
 * SEC-02: enterprise response headers applied to every route.
 *
 * The CSP is deliberately restrictive on resource loading (no wildcard image,
 * media or connect sources; `object-src 'none'`, `base-uri 'self'`,
 * `frame-ancestors 'none'`) while still permitting the inline bootstrap
 * scripts React Server Components emit during hydration.
 */
function buildContentSecurityPolicy(isDevelopment: boolean): string {
  const directives: string[] = [
    "default-src 'self'",
    // React's hydration runtime ships inline bootstrap data. `'unsafe-eval'` is
    // only required by the development compiler and is withheld in production.
    `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com",
    "media-src 'self' blob: https://www.soundhelix.com",
    "font-src 'self' data:",
    "connect-src 'self' blob: https://images.unsplash.com https://www.soundhelix.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'manifest-src \'self\'',
    'worker-src \'self\' blob:',
  ];

  return directives.join('; ');
}

const isDevelopment = process.env.NODE_ENV === 'development';

const securityHeaders = [
  { key: 'Content-Security-Policy', value: buildContentSecurityPolicy(isDevelopment) },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: [
      'accelerometer=()',
      'autoplay=(self)',
      'camera=()',
      'display-capture=()',
      'encrypted-media=(self)',
      'fullscreen=(self)',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'payment=(self)',
      'publickey-credentials-get=(self)',
      'screen-wake-lock=()',
      'usb=()',
      'xr-spatial-tracking=()',
    ].join(', '),
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // SEC-01: explicit allowlist replaces the open wildcard.
    remotePatterns: TRUSTED_IMAGE_ORIGINS,
    // Defence in depth: refuse to optimize anything that is not an image.
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox",
    dangerouslyAllowSVG: false,
    minimumCacheTTL: 60 * 60 * 24 * 30,
    formats: ['image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;