/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // next/imagesを使用する時に外部サイトからsrcを書き換える場合、remotePatternsを指定する必要がある
       remotePatterns: [
        {
            protocol: 'https',
            hostname: 'avatars.githubusercontent.com'
        },
        {
            protocol: 'https',
            hostname: 'images.microcms-assets.io'
        }
       ]
    },
    reactStrictMode: false,
}

module.exports = nextConfig
