import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ChatService, ChatMessage } from '@/services/ChatService';
import { MessageCircle, FileText, Mic, MicOff } from 'lucide-react';

interface ChatInterfaceProps {
  websiteUrls: string[];
}

export const ChatInterface = ({ websiteUrls }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Load chat history on mount
    const history = ChatService.getChatHistory();
    setMessages(history);
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice input logic
  const isSpeechSupported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const startListening = () => {
    if (!isSpeechSupported) {
      toast({
        title: 'Voice not supported',
        description: 'Your browser does not support speech recognition.',
        variant: 'destructive',
      });
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      setIsListening(false);
      toast({
        title: 'Voice input error',
        description: event.error ? `Error: ${event.error}` : 'Unknown error',
        variant: 'destructive',
      });
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      // Auto-send after recognition
      setTimeout(() => {
        handleSubmit(new Event('submit') as any);
      }, 100);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || websiteUrls.length === 0) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input.trim(),
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    ChatService.saveChatMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const result = await ChatService.sendMessage(input.trim(), websiteUrls);
      
      if (result.success && result.response) {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: result.response,
          isUser: false,
          timestamp: Date.now(),
          sources: websiteUrls,
        };

        setMessages(prev => [...prev, botMessage]);
        ChatService.saveChatMessage(botMessage);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to get response",
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

  const clearHistory = () => {
    setMessages([]);
    ChatService.clearChatHistory();
    toast({
      title: "Chat cleared",
      description: "Conversation history has been cleared",
    });
  };

  if (websiteUrls.length === 0) {
    return (
      <div className="p-6 border rounded text-center">
        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <div className="text-base font-medium mb-1">No websites loaded</div>
        <div className="text-gray-500 text-sm">Scrape a website above to start chatting with its content.</div>
      </div>
    );
  }

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-base font-semibold flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Chat
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearHistory}>
            Clear
          </Button>
        )}
      </div>
      <div className="h-72 overflow-y-auto space-y-2 mb-2 border rounded p-2 bg-white">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <div>Start a conversation about the scraped website content!</div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded ${
                  message.isUser
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 border'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                {message.sources && (
                  <div className="text-xs opacity-70 mt-1 border-t pt-1">
                    Sources: {message.sources.length} website(s)
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 border p-2 rounded">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the website content..."
          className="flex-1 text-base border px-2 py-1"
          disabled={isLoading}
        />
        <Button
          type="button"
          onClick={isListening ? stopListening : startListening}
          className={`px-2 py-1 ${isListening ? 'bg-red-100' : ''}`}
          variant={isListening ? 'destructive' : 'outline'}
          tabIndex={-1}
          disabled={isLoading || !isSpeechSupported}
          title={isSpeechSupported ? (isListening ? 'Stop listening' : 'Speak your question') : 'Voice not supported'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          className="px-4 py-1"
        >
          Send
        </Button>
      </form>
    </div>
  );
};
