'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Zap, User, Loader2, Search } from 'lucide-react';

interface Message {
  role: 'user' | 'zeus';
  content: string;
  ts: number;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' });
}

const SUGGESTIONS = [
  '¿Cómo ejecuto correctamente el peso muerto?',
  '¿Qué músculo trabaja el press de banca?',
  'Sugiere una rutina de piernas para hoy',
  '¿Cómo sustituyo las sentadillas si tengo rodilla mal?',
  '¿Cuánto descanso entre series de hipertrofia?',
];

export default function ZeusPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'zeus',
      content:
        '⚡ Soy ZEUS, tu coach de workout en tiempo real. Puedo guiarte en técnica, sustituir ejercicios, recomendarte cargas según tus PRs y planificar tu sesión de hoy. ¿Por dónde empezamos?',
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Member selector (optional — for staff viewing a specific member's context)
  const [memberSearch, setMemberSearch] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberDrop, setShowMemberDrop] = useState(false);
  const memberRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (memberRef.current && !memberRef.current.contains(e.target as Node)) {
        setShowMemberDrop(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (memberSearch.length < 2) {
      setMembers([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/proxy/members?search=${encodeURIComponent(memberSearch)}&limit=6`)
        .then((r) => r.json())
        .then((d: { data?: Member[] } | Member[]) => {
          const list = Array.isArray(d) ? d : (d.data ?? []);
          setMembers(list);
          setShowMemberDrop(true);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [memberSearch]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text.trim(), ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const body: Record<string, string> = { message: text.trim() };
      if (selectedMember) body.memberId = selectedMember.id;

      const res = await fetch('/api/proxy/workout/zeus/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = (await res.json()) as { response?: string; reply?: string };
        const reply = data.response ?? data.reply ?? '(Sin respuesta)';
        setMessages((prev) => [...prev, { role: 'zeus', content: reply, ts: Date.now() }]);
      } else {
        const errBody = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        const detail = Array.isArray(errBody.message)
          ? errBody.message.join(', ')
          : errBody.message;
        const errText =
          res.status === 403
            ? 'ZEUS requiere plan PRO o superior. Verifica el plan de tu gym.'
            : res.status === 401
              ? 'Sesión expirada. Recarga la página e ingresa de nuevo.'
              : detail
                ? `⚠️ Error del servidor: ${detail}`
                : `Error ${res.status} al conectar con ZEUS. Verifica que GEMINI_API_KEY esté configurada.`;
        setMessages((prev) => [...prev, { role: 'zeus', content: errText, ts: Date.now() }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'zeus', content: 'Error de conexión. Verifica tu red.', ts: Date.now() },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-white px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900">ZEUS</h1>
          <p className="text-xs text-gray-500">Zone Expert Universal Support · Coach de Workout</p>
        </div>

        {/* Member context selector */}
        <div className="ml-auto" ref={memberRef}>
          {selectedMember ? (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
              <span className="text-xs font-medium text-amber-800">
                Contexto: {selectedMember.first_name} {selectedMember.last_name}
              </span>
              <button
                onClick={() => {
                  setSelectedMember(null);
                  setMemberSearch('');
                }}
                className="text-amber-500 hover:text-amber-800 text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                <Search className="h-3.5 w-3.5 text-gray-400" />
                <input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  onFocus={() => members.length > 0 && setShowMemberDrop(true)}
                  placeholder="Contexto de miembro (opcional)"
                  className="w-44 bg-transparent text-xs text-gray-600 placeholder-gray-400 focus:outline-none"
                />
              </div>
              {showMemberDrop && members.length > 0 && (
                <ul className="absolute right-0 z-10 mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
                  {members.map((m) => (
                    <li
                      key={m.id}
                      onClick={() => {
                        setSelectedMember(m);
                        setShowMemberDrop(false);
                        setMemberSearch('');
                      }}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-amber-50"
                    >
                      {m.first_name} {m.last_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs text-gray-500">En línea</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 px-4 py-6 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${
                msg.role === 'zeus' ? 'bg-amber-500' : 'bg-gray-700'
              }`}
            >
              {msg.role === 'zeus' ? (
                <Zap className="h-3.5 w-3.5" />
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
            </div>
            <div
              className={`max-w-[75%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'zeus'
                    ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                    : 'bg-amber-500 text-white rounded-tr-sm'
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
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="border-t bg-white px-4 py-3 flex gap-2 overflow-x-auto">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-100 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="border-t bg-white px-4 py-3 flex items-center gap-3"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregunta a ZEUS sobre técnica, cargas, sustituciones..."
          disabled={loading}
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
