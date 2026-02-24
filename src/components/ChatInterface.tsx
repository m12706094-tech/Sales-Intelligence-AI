import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Database, BarChart3, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { Message, Schema } from '../types';
import { generateSQL, generateInsight } from '../services/gemini';
import { DataVisualization } from './DataVisualization';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your Sales Intelligence AI. Ask me anything about your sales data, like "What is our total revenue?" or "Show me the monthly revenue trend by country."'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [schema, setSchema] = useState<Schema | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    { title: "Total Revenue", prompt: "What is our total revenue?" },
    { title: "Monthly Trend", prompt: "Show me the monthly revenue trend." },
    { title: "Top Customers", prompt: "Who are our top 5 customers by revenue?" },
    { title: "Country Comparison", prompt: "Compare revenue between Germany and France." },
    { title: "Average Deal Size", prompt: "What is the average deal size?" }
  ];

  useEffect(() => {
    fetch('/api/schema')
      .then(res => res.json())
      .then(setSchema);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !schema) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Generate SQL
      const sqlResult = await generateSQL(input, schema);
      
      if (sqlResult.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: sqlResult.error }]);
        setIsLoading(false);
        return;
      }

      // 2. Execute Query
      const queryResponse = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlResult.query })
      });
      const queryData = await queryResponse.json();

      if (queryData.error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `I encountered an error while running the query: ${queryData.error}`,
          query: sqlResult.query
        }]);
      } else {
        // 3. Generate Insight
        const insight = await generateInsight(input, queryData.results, sqlResult.query);

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: insight,
          query: sqlResult.query,
          data: queryData.results,
          chartType: sqlResult.suggestedChart,
          insight: insight
        }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I ran into an unexpected error.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
    // Optionally auto-submit:
    // setTimeout(() => {
    //   const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    //   handleSubmit(fakeEvent);
    // }, 10);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-bottom border-zinc-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <BarChart3 className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-semibold text-zinc-900">Sales Intelligence AI</h1>
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Connected to Sales Database
            </p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-4xl mx-auto",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                msg.role === 'user' ? "bg-zinc-900" : "bg-emerald-100"
              )}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-emerald-600" />}
              </div>
              
              <div className={cn(
                "flex flex-col gap-2 max-w-[85%]",
                msg.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-emerald-600 text-white rounded-tr-none" 
                    : "bg-white text-zinc-800 border border-zinc-200 rounded-tl-none"
                )}>
                  <div className="prose prose-sm max-w-none">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>

                {msg.query && (
                  <details className="w-full group">
                    <summary className="text-[10px] font-mono text-zinc-400 cursor-pointer hover:text-zinc-600 flex items-center gap-1 list-none">
                      <Database className="w-3 h-3" />
                      VIEW SQL QUERY
                    </summary>
                    <div className="mt-2 p-3 bg-zinc-900 rounded-lg text-[11px] font-mono text-emerald-400 overflow-x-auto border border-zinc-800">
                      {msg.query}
                    </div>
                  </details>
                )}

                {msg.data && msg.chartType && (
                  <div className="w-full bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm mt-2">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        {msg.chartType} Visualization
                      </span>
                    </div>
                    <DataVisualization data={msg.data} type={msg.chartType} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 max-w-4xl mx-auto"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="bg-white border border-zinc-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              <span className="text-sm text-zinc-500 italic">Analyzing data...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length === 1 && !isLoading && (
        <div className="px-6 pb-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s.prompt)}
                className="text-left p-4 bg-white border border-zinc-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all group"
              >
                <div className="text-xs font-semibold text-zinc-900 mb-1 group-hover:text-emerald-600 transition-colors">{s.title}</div>
                <div className="text-xs text-zinc-500 line-clamp-1 italic">"{s.prompt}"</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-zinc-200">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your sales..."
            className="w-full pl-6 pr-14 py-4 bg-zinc-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 bottom-2 px-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200 flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-center text-[10px] text-zinc-400 mt-3 uppercase tracking-widest">
          Powered by Gemini 3.1 Pro & Deterministic SQL Engine
        </p>
      </div>
    </div>
  );
};
