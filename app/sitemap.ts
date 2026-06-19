import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://www.quranandislamic.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // آپ اپنے دیگر صفحات کے لنکس یہاں مزید ایڈ کر سکتے ہیں
    {
      url: 'https://www.quranandislamic.com/courses',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://www.quranandislamic.com/articles',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://www.quranandislamic.com/contact',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://www.quranandislamic.com/signup',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];
}