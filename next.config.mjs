// /** @type {import('next').NextConfig} */
// const nextConfig = {
//     experimental: {
//         instrumentationHook: true,
//     },
//     reactStrictMode: false,
// };
// export default nextConfig;


// /** @type {import('next').NextConfig} */
// const nextConfig = {
//     reactStrictMode: false,
//     rewrites: async () => {
//       return [
//         {
//           source: '/api/:path*',
//           destination:
//             process.env.NODE_ENV === 'development'
//               ? 'http://127.0.0.1:5328/api/:path*'
//               : '/api/',
//         },
//       ]
//     },
//   }

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  rewrites: async () => {
    return [
      {
        source: "/api/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/:path*"
            : "/api/",
      },
      // {
      //   source: "/docs",
      //   destination:
      //     process.env.NODE_ENV === "development"
      //       ? "http://127.0.0.1:8000/docs"
      //       : "/api/docs",
      // },
      // {
      //   source: "/openapi.json",
      //   destination:
      //     process.env.NODE_ENV === "development"
      //       ? "http://127.0.0.1:8000/openapi.json"
      //       : "/api/openapi.json",
      // },
    ];
  },
};
export default nextConfig;
