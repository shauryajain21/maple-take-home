import FirecrawlApp from '@mendable/firecrawl-js';

interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  links: string[];
  scrapedAt: number;
}

export class ScrapingService {
  private static readonly STORAGE_KEY = 'scraped_websites';
  private static readonly API_KEY_STORAGE = 'firecrawl_api_key';

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE, apiKey);
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE);
  }

  static async scrapeWebsite(url: string): Promise<{ success: boolean; data?: ScrapedContent; error?: string }> {
    try {
      console.log('Scraping website:', url);
      
      const apiKey = this.getApiKey();
      
      if (apiKey) {
        // Use Firecrawl if API key is available
        try {
          const app = new FirecrawlApp({ apiKey });
          const scrapeResult = await app.scrapeUrl(url, {
            formats: ['markdown', 'html'],
            onlyMainContent: true
          });

          if (scrapeResult.success) {
            const scrapedData: ScrapedContent = {
              url,
              title: scrapeResult.metadata?.title || url,
              content: scrapeResult.markdown || scrapeResult.html || '',
              links: this.extractLinks(scrapeResult.html || ''),
              scrapedAt: Date.now()
            };

            this.saveScrapedContent(scrapedData);
            console.log('Successfully scraped with Firecrawl:', scrapedData.title);
            return { success: true, data: scrapedData };
          }
        } catch (firecrawlError) {
          console.warn('Firecrawl failed, falling back to simple fetch:', firecrawlError);
        }
      }
      
      // Fallback to simple fetch with CORS proxy
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const html = await response.text();
      
      // Extract text content and links
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extract title
      const title = doc.querySelector('title')?.textContent || url;
      
      // Extract main content (remove scripts, styles, etc.)
      const scripts = doc.querySelectorAll('script, style, nav, header, footer');
      scripts.forEach(el => el.remove());
      
      const content = doc.body?.textContent || doc.documentElement.textContent || '';
      const cleanContent = content.replace(/\s+/g, ' ').trim();
      
      // Extract links
      const links = this.extractLinks(html);
      
      const scrapedData: ScrapedContent = {
        url,
        title,
        content: cleanContent.slice(0, 50000), // Limit content size
        links,
        scrapedAt: Date.now()
      };

      // Save to localStorage
      this.saveScrapedContent(scrapedData);
      
      console.log('Successfully scraped with fallback:', title);
      return { success: true, data: scrapedData };
      
    } catch (error) {
      console.error('Scraping error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to scrape website. Try setting a Firecrawl API key for better results.' 
      };
    }
  }

  private static extractLinks(html: string): string[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const linkElements = doc.querySelectorAll('a[href]');
    return Array.from(linkElements)
      .map(a => a.getAttribute('href'))
      .filter(href => href && (href.startsWith('http') || href.startsWith('/')))
      .slice(0, 20); // Limit to first 20 links
  }

  static saveScrapedContent(content: ScrapedContent): void {
    const existing = this.getScrapedContent();
    const updated = existing.filter(item => item.url !== content.url);
    updated.unshift(content);
    
    // Keep only last 10 scraped sites
    const limited = updated.slice(0, 10);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limited));
  }

  static getScrapedContent(): ScrapedContent[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static getContentByUrl(url: string): ScrapedContent | null {
    const content = this.getScrapedContent();
    return content.find(item => item.url === url) || null;
  }
}
