import { useState, useRef, useEffect } from 'react';
import type { ResumeData } from '../types';
import { Send, X, Loader2, Sparkles, Key, Trash2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatSidebarProps {
  resumeData: ResumeData;
  onClose: () => void;
}

const SYSTEM_PROMPT = `You are an expert resume editor and career coach. You help users improve their resumes for job applications.

Your capabilities:
- Rewrite bullets for stronger impact and clarity
- Shorten or expand content as needed
- Improve tone, professionalism, and action verb usage
- Suggest stronger, more ATS-friendly language
- Tailor resume content for specific roles or companies
- Identify missing metrics, weak phrasing, and duplicate content
- Provide section-specific feedback

Format your responses with clear sections when appropriate. Use bullet points for suggestions.
When providing rewrites, clearly label the original vs improved version.
Be specific, actionable, and concise.`;

export function AIChatSidebar({ resumeData, onClose }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = sessionStorage.getItem('resume-ai-chat');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('resume-openai-key') || '');
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem('resume-openai-key'));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem('resume-ai-chat', JSON.stringify(messages));
  }, [messages]);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('resume-openai-key', key);
    setShowKeyInput(false);
  };

  const clearApiKey = () => {
    setApiKey('');
    localStorage.removeItem('resume-openai-key');
    setShowKeyInput(true);
  };

  const clearChat = () => {
    setMessages([]);
    sessionStorage.removeItem('resume-ai-chat');
  };

  const getResumeContext = () => {
    const { contact, summary, skills, experience, projects, education, achievements } = resumeData;
    return [
      '=== CURRENT RESUME ===',
      '',
      `Name: ${contact.fullName || '(not set)'}`,
      `Email: ${contact.email || '(not set)'}`,
      `Phone: ${contact.phone || '(not set)'}`,
      `Location: ${contact.location || '(not set)'}`,
      `LinkedIn: ${contact.linkedin || '(not set)'}`,
      `GitHub: ${contact.github || '(not set)'}`,
      '',
      '--- Summary ---',
      summary || '(not set)',
      '',
      '--- Skills ---',
      skills.length ? skills.join(', ') : '(none)',
      '',
      '--- Experience ---',
      ...experience.flatMap(e => [
        `${e.position} at ${e.company} (${e.startDate || '?'} - ${e.current ? 'Present' : e.endDate || '?'})`,
        ...e.bullets.map(b => `  • ${b}`),
        '',
      ]),
      '--- Projects ---',
      ...projects.flatMap(p => [
        `${p.name}${p.link ? ` (${p.link})` : ''}`,
        `  ${p.description || ''}`,
        ...p.bullets.map(b => `  • ${b}`),
        '',
      ]),
      '--- Education ---',
      ...education.map(e =>
        `${e.degree}${e.institution ? ` from ${e.institution}` : ''} (${e.startDate || ''} - ${e.endDate || ''})${e.gpa ? ` GPA: ${e.gpa}` : ''}`
      ),
      '',
      '--- Achievements & Certifications ---',
      ...achievements.map(a => `${a.title}${a.description ? ` - ${a.description}` : ''}${a.date ? ` (${a.date})` : ''}`),
    ].join('\n');
  };

  const sendMessage = async () => {
    if (!input.trim() || !apiKey) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const context = getResumeContext();
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Here is my current resume for context:\n\n${context}\n\nPlease help me with the following: ${input}` },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.choices[0].message.content,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, there was an error connecting to the AI. Please check your API key and try again.\n\nIf the problem persists, ensure you have a valid OpenAI API key with access to the gpt-4o-mini model.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedPrompts = [
    'Rewrite my experience bullets for stronger impact',
    'Suggest better action verbs for my resume',
    'How can I improve ATS friendliness?',
    'Tailor my resume for a Senior Engineer role',
    'Identify weak phrasing or missing metrics',
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary-500" />
          <h2 className="font-semibold text-sm text-gray-800">AI Assistant</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title="Clear chat"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* API Key input */}
      {showKeyInput && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Key size={14} className="text-amber-600" />
            <span className="text-xs font-medium text-amber-800">OpenAI API Key Required</span>
          </div>
          <div className="flex gap-1">
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 px-2.5 py-1.5 border border-amber-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            />
            <button
              onClick={() => saveApiKey(apiKey)}
              disabled={!apiKey.trim()}
              className="px-3 py-1.5 bg-primary-500 text-white text-xs rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
          <p className="text-xs text-amber-600 mt-1">
            Your key is stored locally and never sent anywhere except OpenAI.
          </p>
        </div>
      )}

      {apiKey && !showKeyInput && (
        <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-500">API key configured</span>
          <button onClick={clearApiKey} className="text-xs text-gray-400 hover:text-gray-600 underline">
            Change
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <Sparkles size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-400 mb-3">
              Ask the AI to help improve your resume. It has full context of your current resume.
            </p>
            <div className="space-y-1.5">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(prompt); }}
                  disabled={!apiKey}
                  className="block w-full text-left px-3 py-2 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}>
              <p className="whitespace-pre-wrap font-sans text-[13px]">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg flex items-center gap-2">
              <Loader2 className="animate-spin" size={14} />
              <span className="text-xs text-gray-500">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-200 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for resume help..."
            disabled={!apiKey}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-shadow"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !apiKey || isLoading}
            className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5 text-center">
          AI may produce inaccurate information. Review all suggestions.
        </p>
      </div>
    </div>
  );
}
