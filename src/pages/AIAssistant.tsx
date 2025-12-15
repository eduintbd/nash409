import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, User, Send, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const suggestedQuestions = [
  "Show flats with pending payments",
  "What's the total expense this month?",
  "How many service requests are open?",
  "List all vacant flats",
];

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your Building Management Assistant. I can help you with queries about flats, payments, expenses, and service requests. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const responses: Record<string, string> = {
        'pending': "Based on current records, there are **3 flats** with pending payments:\n\n- **A-103** (₹4,500 - Unpaid)\n- **A-104** (₹5,000 - Overdue)\n- **A-202** (₹4,500 - Unpaid)\n\nTotal pending: **₹14,000**\n\nWould you like me to send payment reminders?",
        'expense': "Here's the expense summary for December 2024:\n\n| Category | Amount |\n|----------|--------|\n| Security | ₹36,000 |\n| Cleaning | ₹12,000 |\n| Electricity | ₹8,500 |\n| Elevator | ₹5,000 |\n| Repairs | ₹4,500 |\n| Water | ₹3,500 |\n\n**Total: ₹69,500**",
        'service': "Currently there are **2 open** service requests:\n\n1. **Water leakage** (A-103) - High Priority\n2. **Streetlight not working** - Medium Priority\n\nAnd **1 in-progress**:\n- **AC power fluctuation** (A-201)\n\nWould you like details on any specific request?",
        'vacant': "There is **1 vacant flat** currently:\n\n- **A-203** (Floor 2, 1000 sq.ft)\n  - Owner: Arjun Reddy\n  - Available since: November 2024\n\nWould you like to list it for rent?",
      };

      const lowercaseInput = input.toLowerCase();
      let response = "I can help you with information about flats, payments, expenses, and service requests. Could you please be more specific about what you'd like to know?";

      if (lowercaseInput.includes('pending') || lowercaseInput.includes('payment') || lowercaseInput.includes('due')) {
        response = responses['pending'];
      } else if (lowercaseInput.includes('expense') || lowercaseInput.includes('cost')) {
        response = responses['expense'];
      } else if (lowercaseInput.includes('service') || lowercaseInput.includes('request') || lowercaseInput.includes('open')) {
        response = responses['service'];
      } else if (lowercaseInput.includes('vacant') || lowercaseInput.includes('empty')) {
        response = responses['vacant'];
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleSuggestion = (question: string) => {
    setInput(question);
  };

  return (
    <MainLayout>
      <Header 
        title="AI Assistant" 
        subtitle="Ask questions about your building data"
      />
      
      <div className="p-6 h-[calc(100vh-5rem)] flex flex-col animate-fade-in">
        {/* Info Banner */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm">
              <strong>AI-powered queries</strong> - Ask natural language questions about your building data
            </span>
          </div>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {message.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted p-4 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question) => (
                  <Button
                    key={question}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSuggestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask a question about your building..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[44px] max-h-32 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button onClick={handleSend} disabled={!input.trim() || isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AIAssistant;
