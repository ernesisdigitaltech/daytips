export default function sitemap() {
  const baseUrl = 'https://www.getdaytips.com'
  const now = new Date()

  const pages = [
    { path: '', changeFrequency: 'daily', priority: 1 },
    { path: '/subscribe', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/download', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/login', changeFrequency: 'yearly', priority: 0.4 },
    { path: '/signup', changeFrequency: 'yearly', priority: 0.5 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/responsible-gambling', changeFrequency: 'yearly', priority: 0.3 },
  ]

  return pages.map((p) => ({
    url: `${baseUrl}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }))
}