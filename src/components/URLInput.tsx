import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ScrapingService } from '@/services/ScrapingService';
import { Link, Globe } from 'lucide-react';

interface URLInputProps {
  onWebsiteScraped: (url: string) => void;
  scrapedUrls: string[];
}

export const URLInput = ({ onWebsiteScraped, scrapedUrls }: URLInputProps) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    // Simple URL validation
    let processedUrl = url.trim();
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
    }

    try {
      new URL(processedUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid website URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await ScrapingService.scrapeWebsite(processedUrl);
      if (result.success && result.data) {
        toast({
          title: "Website scraped successfully",
          description: `Loaded content from ${result.data.title}`,
        });
        onWebsiteScraped(processedUrl);
        setUrl('');
      } else {
        toast({
          title: "Scraping failed",
          description: result.error || "Failed to scrape website",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2 w-full">
      <form onSubmit={handleSubmit} className="flex gap-2 w-full">
        <Input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="flex-1 text-base border px-2 py-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !url.trim()} className="px-4 py-1">
          {isLoading ? "Scraping..." : "Scrape"}
        </Button>
      </form>
      {scrapedUrls.length > 0 && (
        <div className="mt-2">
          <div className="text-xs font-medium mb-1">Scraped Websites:</div>
          <ul className="text-xs space-y-1">
            {scrapedUrls.map((scrapedUrl) => {
              const content = ScrapingService.getContentByUrl(scrapedUrl);
              return (
                <li key={scrapedUrl} className="truncate">
                  <span className="font-semibold">{content?.title || 'Untitled'}:</span> <span className="text-gray-600">{scrapedUrl}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
