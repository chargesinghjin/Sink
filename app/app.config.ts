export default defineAppConfig({
  title: 'WeMaker',
  email: 'jin@wemaker.space',
  github: 'https://github.com/chargesinghjin',
  twitter: '',
  telegram: '',
  blog: 'https://wemaker.space',
  description: 'A Simple / Speedy / Secure Link Shortener with Analytics, 100% run on Cloudflare.',
  image: 'https://sink.cool/banner.png',
  previewTTL: 300, // 5 minutes
  slugRegex: /^[a-z0-9]+(?:-[a-z0-9]+)*$/i,
  reserveSlug: [
    'dashboard',
  ],
})
