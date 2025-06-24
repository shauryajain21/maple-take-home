import { useState, useEffect } from 'react';
import { URLInput } from '@/components/URLInput';
import { ChatInterface } from '@/components/ChatInterface';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import { ScrapingService } from '@/services/ScrapingService';

const Index = () => {
  const [scrapedUrls, setScrapedUrls] = useState<string[]>([]);

  useEffect(() => {
    // Load existing scraped URLs on mount
    const existing = ScrapingService.getScrapedContent();
    setScrapedUrls(existing.map(content => content.url));
  }, []);

  const handleWebsiteScraped = (url: string) => {
    setScrapedUrls(prev => {
      if (prev.includes(url)) return prev;
      return [url, ...prev];
    });
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #f0f8ff, #e6f3ff)' }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#0060FE' }}>
            Website Chat
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Shaurya For Maple AI
          </p>
        </div>

        <div className="mb-8">
          <ApiKeyInput />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <URLInput 
              onWebsiteScraped={handleWebsiteScraped}
              scrapedUrls={scrapedUrls}
            />
          </div>
          
          <div className="space-y-6">
            <ChatInterface websiteUrls={scrapedUrls} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
