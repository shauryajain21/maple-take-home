import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';

export function ApiKeyInput() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsSaved(true);
    }
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openai_api_key', apiKey.trim());
      setIsSaved(true);
    }
  };

  const handleRemove = () => {
    localStorage.removeItem('openai_api_key');
    setApiKey('');
    setIsSaved(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">OpenAI API Key</CardTitle>
        <CardDescription className="text-center">
          Enter your OpenAI API key to enable AI-powered conversations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Input
            type={showKey ? 'text' : 'password'}
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="flex gap-2">
          {!isSaved ? (
            <Button onClick={handleSave} className="flex-1" disabled={!apiKey.trim()}>
              Save API Key
            </Button>
          ) : (
            <>
              <Button onClick={handleSave} className="flex-1" variant="outline">
                Update
              </Button>
              <Button onClick={handleRemove} variant="destructive">
                Remove
              </Button>
            </>
          )}
        </div>
        
        {isSaved && (
          <p className="text-sm text-green-600 text-center">
            ✅ API key saved successfully
          </p>
        )}
      </CardContent>
    </Card>
  );
}
