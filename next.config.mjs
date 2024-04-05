/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [{
            protocol: "https",
            hostname: "liveblocks.io",
            port: ""
        }]
    },

    // fix error
    reactStrictMode: true,
    experimental: {
        appDir: true,
        esmExternals: "loose", // required to make Konva & react-konva work
    },
    webpack: (config) => {
        config.externals = [...config.externals, { canvas: "canvas" }];  // required to make Konva & react-konva work
        return config;
    },
};

export default nextConfig;
