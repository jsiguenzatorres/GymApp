'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Send, Bot, User, Loader2, X } from 'lucide-react';

interface Message {
  role: 'user' | 'aria';
  content: string;
  ts: number;
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' });
}

export default function AriaPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'aria',
      content:
        '¡Hola! Soy ARIA, tu asistente de relaciones con miembros. Puedo ayudarte a analizar el estado de un miembro, sugerir estrategias de retención, o responder preguntas sobre el gym. ¿En qué puedo ayudarte hoy?',
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    // El backend no persiste el historial de este chat (lo usa el staff/admin,
    // no un miembro con sesión propia) — se manda lo que ya está en pantalla
    // para que ARIA no pierda el contexto entre mensajes. Se excluye el saludo
    // inicial (índice 0), que no es un intercambio real.
    const historyToSend = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));
    const userMsg: Message = { role: 'user', content: text.trim(), ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/proxy/aria/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history: historyToSend }),
      });

      if (res.ok) {
        const data = (await res.json()) as { reply?: string; response?: string; message?: string };
        const reply = data.reply ?? data.response ?? data.message ?? '(Sin respuesta)';
        setMessages((prev) => [...prev, { role: 'aria', content: reply, ts: Date.now() }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'aria',
            content: 'Lo siento, hubo un error al procesar tu mensaje. Intenta de nuevo.',
            ts: Date.now(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'aria',
          content: 'Error de conexión. Verifica tu red e intenta de nuevo.',
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  const SUGGESTIONS = [
    '¿Quiénes son los miembros con mayor riesgo de cancelar?',
    '¿Cómo puedo mejorar la retención este mes?',
    '¿Qué estrategias recomiendas para miembros inactivos?',
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-white px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900">ARIA</h1>
          <p className="text-xs text-gray-500">Asistente Relacional Inteligente · En línea</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-500">Activa</span>
        </div>

        <Link
          href="/crm"
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Cerrar ARIA"
          title="Cerrar"
        >
          <X className="h-4 w-4" />
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-xs ${
                msg.role === 'aria' ? 'bg-violet-600' : 'bg-gray-700'
              }`}
            >
              {msg.role === 'aria' ? (
                <Bot className="h-3.5 w-3.5" />
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}
            >
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'aria'
                    ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                    : 'bg-violet-600 text-white rounded-tr-sm'
                }`}
              >
                {msg.content}
              </div>
              <span className="text-[10px] text-gray-400 px-1">{fmtTime(msg.ts)}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions — shown only when empty */}
      {messages.length === 1 && (
        <div className="border-t bg-white px-4 py-3 flex gap-2 overflow-x-auto">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs text-violet-700 hover:bg-violet-100 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t bg-white px-4 py-3 flex items-center gap-3">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje para ARIA..."
          disabled={loading}
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
