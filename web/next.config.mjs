/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // Railway builds a container; standalone keeps the runtime image small.
  output: 'standalone',
};
