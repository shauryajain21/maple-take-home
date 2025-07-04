import { ScrapingService } from './ScrapingService';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
  sources?: string[];
}

export class ChatService {
  private static readonly CHAT_STORAGE = 'chat_history';

  static async sendMessage(message: string, websiteUrls: string[]): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      console.log('Processing chat message:', message);
      
      // Get content from scraped websites
      const contexts = websiteUrls
        .map(url => ScrapingService.getContentByUrl(url))
        .filter(Boolean)
        .map(content => ({
          url: content!.url,
          title: content!.title,
          text: content!.content,
          links: content!.links
        }));

      if (contexts.length === 0) {
        return {
          success: false,
          error: 'No website content available. Please scrape a website first.'
        };
      }

      // Call the local backend API
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          contexts
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.response) {
        return { success: true, response: data.response };
      } else {
        throw new Error(data.error || 'No response from API');
      }
    } catch (error) {
      console.error('Chat error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process message'
      };
    }
  }

  private static generateIntelligentResponse(message: string, contexts: Array<{url: string, title: string, text: string, links: string[]}>): string {
    const lowerMessage = message.toLowerCase();
    
    // Handle summary requests
    if (lowerMessage.includes('summary') || lowerMessage.includes('summarize') || lowerMessage.includes('about')) {
      return this.generateSummary(contexts);
    }
    
    // Handle link requests
    if (lowerMessage.includes('links') || lowerMessage.includes('link')) {
      return this.generateLinksResponse(contexts);
    }
    
    // Handle structure/organization questions
    if (lowerMessage.includes('structure') || lowerMessage.includes('organize') || lowerMessage.includes('sections')) {
      return this.analyzeStructure(contexts);
    }
    
    // Handle specific topic searches
    const searchTerms = this.extractSearchTerms(message);
    if (searchTerms.length > 0) {
      return this.searchContent(searchTerms, contexts);
    }
    
    // Default comprehensive response
    return this.generateOverviewResponse(contexts);
  }

  private static generateSummary(contexts: Array<{url: string, title: string, text: string, links: string[]}>): string {
    const summaries = contexts.map(ctx => {
      const sentences = ctx.text.split(/[.!?]+/).filter(s => s.trim().length > 20);
      const keySentences = sentences.slice(0, 5);
      return `**${ctx.title}**\n${keySentences.join('. ')}...\n*Source: ${ctx.url}*`;
    });
    
    return `Here's a summary of the ${contexts.length} website(s):\n\n${summaries.join('\n\n')}`;
  }

  private static generateLinksResponse(contexts: Array<{url: string, title: string, text: string, links: string[]}>): string {
    const allLinks = contexts.flatMap(ctx => 
      ctx.links.map(link => ({ link, source: ctx.title, url: ctx.url }))
    );
    
    if (allLinks.length === 0) {
      return "I didn't find any external links in the scraped content.";
    }
    
    const linksList = allLinks.slice(0, 10).map(item => `• ${item.link}`).join('\n');
    return `I found ${allLinks.length} links across the websites:\n\n${linksList}\n\n${allLinks.length > 10 ? '...and more' : ''}`;
  }

  private static analyzeStructure(contexts: Array<{url: string, title: string, text: string, links: string[]}>): string {
    const analysis = contexts.map(ctx => {
      const wordCount = ctx.text.split(/\s+/).length;
      const paragraphs = ctx.text.split(/\n\s*\n/).length;
      const linkCount = ctx.links.length;
      
      return `**${ctx.title}**\n- Word count: ~${wordCount}\n- Sections: ~${paragraphs}\n- Links: ${linkCount}\n*Source: ${ctx.url}*`;
    });
    
    return `Here's the structure analysis:\n\n${analysis.join('\n\n')}`;
  }

  private static extractSearchTerms(message: string): string[] {
    // Remove common words and extract meaningful terms
    const commonWords = ['what', 'is', 'are', 'the', 'about', 'tell', 'me', 'can', 'you', 'how', 'when', 'where', 'why', 'do', 'does'];
    return message.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .slice(0, 5); // Limit search terms
  }

  private static searchContent(searchTerms: string[], contexts: Array<{url: string, title: string, text: string, links: string[]}>): string {
    const results = [];
    
    for (const ctx of contexts) {
      const sentences = ctx.text.split(/[.!?]+/).filter(s => s.trim().length > 20);
      const matchingSentences = sentences.filter(sentence => 
        searchTerms.some(term => sentence.toLowerCase().includes(term))
      );
      
      if (matchingSentences.length > 0) {
        results.push({
          title: ctx.title,
          url: ctx.url,
          matches: matchingSentences.slice(0, 3)
        });
      }
    }
    
    if (results.length === 0) {
      return `I couldn't find specific information about "${searchTerms.join(', ')}" in the scraped content. Try asking about the main topics or request a summary instead.`;
    }
    
    const formattedResults = results.map(result => 
      `**${result.title}**\n${result.matches.join('. ')}\n*Source: ${result.url}*`
    ).join('\n\n');
    
    return `Here's what I found about "${searchTerms.join(', ')}":\n\n${formattedResults}`;
  }

  private static generateOverviewResponse(contexts: Array<{url: string, title: string, text: string, links: string[]}>): string {
    const titles = contexts.map(ctx => ctx.title).join(', ');
    const totalWords = contexts.reduce((sum, ctx) => sum + ctx.text.split(/\s+/).length, 0);
    const totalLinks = contexts.reduce((sum, ctx) => sum + ctx.links.length, 0);
    
    return `I have access to ${contexts.length} website(s): ${titles}.\n\nTotal content: ~${totalWords} words, ${totalLinks} links.\n\nYou can ask me to:\n• Summarize the content\n• Find specific information\n• Analyze the structure\n• List available links\n• Search for particular topics`;
  }

  static saveChatMessage(message: ChatMessage): void {
    const history = this.getChatHistory();
    history.push(message);
    
    // Keep only last 100 messages
    const limited = history.slice(-100);
    localStorage.setItem(this.CHAT_STORAGE, JSON.stringify(limited));
  }

  static getChatHistory(): ChatMessage[] {
    try {
      const stored = localStorage.getItem(this.CHAT_STORAGE);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static clearChatHistory(): void {
    localStorage.removeItem(this.CHAT_STORAGE);
  }
}

export type { ChatMessage };
