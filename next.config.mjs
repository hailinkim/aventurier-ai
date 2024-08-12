// /** @type {import('next').NextConfig} */
// const nextConfig = {
//     experimental: {
//         instrumentationHook: true,
//     },
//     reactStrictMode: false,
// };
// export default nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    rewrites: async () => {
      return [
        {
          source: '/api/:path*',
          destination:
            process.env.NODE_ENV === 'development'
              ? 'http://127.0.0.1:5328/api/:path*'
              : '/api/',
        },
      ]
    },
  }
export default nextConfig;
