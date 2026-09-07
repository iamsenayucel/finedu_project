import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Loader2 } from 'lucide-react';
import chatbotLogo from '../assets/chatbot_logo.png';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const API_BASE = 'https://finedu-project.onrender.com';

const WELCOME: Message = {
  role: 'assistant',
  content:
    'Merhaba! Ben FinEdu asistanıyım 👋 Finansal kavramlar, platform oyunları veya eğitimler hakkında sormak istediğin her şeyi sorabilirsin!',
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const token = localStorage.getItem('token');
  if (!token) return null;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chatbot/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });

      let data: Record<string, string> = {};
      try {
        data = await res.json();
      } catch {
        // Sunucu JSON değil HTML döndürdü (endpoint henüz deploy edilmemiş olabilir)
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.ok && data.reply
            ? data.reply
            : (data.error || `Sunucu hatası (${res.status}). Backend deploy edildi mi ve OPENAI_API_KEY tanımlı mı?`),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sunucuya ulaşılamadı. İnternet bağlantını veya Render servisinin ayakta olup olmadığını kontrol et.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 16 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="mb-3 w-80 sm:w-96 bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ height: '480px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-indigo-600 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-0.5">
                  <img src={chatbotLogo} alt="FinEdu Asistanı" className="size-7 rounded-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">FinEdu Asistanı</p>
                  <p className="text-white/70 text-xs">Finansal okuryazarlık rehberi</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 self-end">
                      <img src={chatbotLogo} alt="" className="size-7 rounded-full object-cover" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="bg-primary/10 rounded-full p-1.5 flex-shrink-0 self-end">
                      <User className="size-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="flex-shrink-0 self-end">
                    <img src={chatbotLogo} alt="" className="size-7 rounded-full object-cover" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                    <span className="size-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="size-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="size-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2 flex-shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Soru sor..."
                disabled={isLoading}
                className="flex-1 bg-muted rounded-xl px-3.5 py-2.5 text-sm outline-none border border-transparent focus:border-primary transition-colors placeholder:text-muted-foreground disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-primary text-primary-foreground rounded-xl px-3 py-2.5 disabled:opacity-40 hover:bg-primary/90 active:scale-95 transition-all flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating toggle button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen((v) => !v)}
        className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-2xl flex items-center justify-center transition-colors hover:bg-primary/90 size-16"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="size-6" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <img src={chatbotLogo} alt="Sohbet asistanını aç" className="size-full rounded-full object-cover" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
