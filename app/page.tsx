"use client";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Source = { title: string; url: string; snippet: string };
type Msg = { role: "user" | "assistant"; content: string; sources?: Source[]; note?: string; error?: boolean };
type Chat = { id: string; title: string; messages: Msg[] };

const SUGGEST = ["Bugungi texnologiya yangiliklari nimalar?", "React'da useEffect'ni sodda tushuntir", "Ish uchun rasmiy xat yozib ber", "Kvant kompyuterlari qanday ishlaydi?"];
const uid = () => Math.random().toString(36).slice(2);

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [cur, setCur] = useState<string>("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState(true);
  const [dark, setDark] = useState(true);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const abort = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { const c = JSON.parse(localStorage.getItem("nx_chats") || "[]"); setChats(c); setCur(c[0]?.id || ""); setDark(localStorage.getItem("nx_dark") !== "0"); } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem("nx_chats", JSON.stringify(chats)); } catch {} }, [chats]);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); try { localStorage.setItem("nx_dark", dark ? "1" : "0"); } catch {} }, [dark]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [chats, busy]);

  const chat = chats.find((c) => c.id === cur);
  const patch = (id: string, fn: (c: Chat) => Chat) => setChats((cs) => cs.map((c) => (c.id === id ? fn(c) : c)));

  async function run(id: string, history: Msg[]) {
    setBusy(true);
    const ac = new AbortController(); abort.current = ac;
    patch(id, (c) => ({ ...c, messages: [...history, { role: "assistant", content: "" }] }));
    const set = (m: Partial<Msg>) => patch(id, (c) => ({ ...c, messages: c.messages.map((x, i) => (i === c.messages.length - 1 ? { ...x, ...m } : x)) }));
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, signal: ac.signal,
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })), useSearch: search }) });
      if (!r.ok || !r.body) { const e = await r.json().catch(() => ({})); set({ content: e.error || "Xatolik yuz berdi.", error: true }); return; }
      const reader = r.body.getReader(), dec = new TextDecoder(); let buf = "", text = "", head = false;
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        if (!head) { const i = buf.indexOf("\n"); if (i < 0) continue; const h = JSON.parse(buf.slice(2, i)); set({ sources: h.sources, note: h.note }); buf = buf.slice(i + 1); head = true; }
        text += buf; buf = ""; set({ content: text });
      }
    } catch (e: any) { if (e.name !== "AbortError") set({ content: "Tarmoq xatosi. Qayta urinib ko'ring.", error: true }); }
    finally { setBusy(false); abort.current = null; }
  }

  function send(text: string) {
    text = text.trim(); if (!text || busy) return;
    let id = cur; const m: Msg = { role: "user", content: text };
    if (!chat) { id = uid(); setChats((cs) => [{ id, title: text.slice(0, 40), messages: [] }, ...cs]); setCur(id); }
    setInput(""); run(id, [...(chat?.messages || []), m]);
  }
  function regenerate() {
    if (!chat || busy) return; const h = chat.messages.slice(0, -1); if (h.length) run(chat.id, h);
  }
  const rename = (c: Chat) => { const t = prompt("Yangi nom", c.title); if (t) patch(c.id, (x) => ({ ...x, title: t })); };
  const del = (id: string) => { setChats((cs) => cs.filter((c) => c.id !== id)); if (cur === id) setCur(""); };
  const shown = chats.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()));
  const btn = "rounded-lg px-2 py-1 text-xs text-[var(--mute)] hover:text-[var(--text)] hover:bg-[var(--line)]";

  return (
    <div className="flex h-dvh">
      <aside className={`${menu ? "flex" : "hidden"} md:flex fixed md:static inset-y-0 z-20 w-72 flex-col gap-3 border-r border-[var(--line)] bg-[var(--panel)] p-3`}>
        <div className="flex items-center justify-between px-1"><span className="text-lg font-semibold tracking-tight">NEXORA</span>
          <button aria-label="Mavzuni almashtirish" className={btn} onClick={() => setDark(!dark)}>{dark ? "Yorug'" : "Qorong'i"}</button></div>
        <button className="rounded-xl bg-[var(--acc)] px-3 py-2 text-sm font-medium text-white" onClick={() => { setCur(""); setMenu(false); }}>+ Yangi suhbat</button>
        <input aria-label="Suhbatlarni qidirish" placeholder="Suhbatlarni qidirish" value={q} onChange={(e) => setQ(e.target.value)} className="rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm" />
        <nav className="flex-1 space-y-1 overflow-auto">
          {shown.length === 0 && <p className="px-2 text-sm text-[var(--mute)]">Hozircha suhbat yo'q.</p>}
          {shown.map((c) => (
            <div key={c.id} className={`group flex items-center rounded-xl px-2 py-1.5 text-sm ${c.id === cur ? "bg-[var(--line)]" : ""}`}>
              <button className="flex-1 truncate text-left" onClick={() => { setCur(c.id); setMenu(false); }}>{c.title}</button>
              <button className={btn} aria-label="Nomini o'zgartirish" onClick={() => rename(c)}>Nom</button>
              <button className={btn} aria-label="O'chirish" onClick={() => del(c.id)}>O'chir</button>
            </div>))}
        </nav>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-[var(--line)] p-3 md:hidden">
          <button className={btn} onClick={() => setMenu(!menu)} aria-label="Menyu">Menyu</button><span className="font-semibold">NEXORA</span></header>
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-3xl px-4 py-8">
            {!chat || chat.messages.length === 0 ? (
              <div className="pt-[12vh] text-center">
                <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Ask anything. Discover everything.</h1>
                <p className="mx-auto mt-4 max-w-xl text-[var(--mute)]">Your personal AI assistant for knowledge, creativity, research, and productivity.</p>
                <div className="mt-10 grid gap-3 sm:grid-cols-2">{SUGGEST.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 text-left text-sm hover:border-[var(--acc)]">{s}</button>))}</div>
              </div>
            ) : chat.messages.map((m, i) => (
              <div key={i} className={`mb-6 ${m.role === "user" ? "flex justify-end" : ""}`}>
                <div className={m.role === "user" ? "max-w-[85%] rounded-2xl bg-[var(--acc)] px-4 py-2 text-white" : "w-full"}>
                  {m.role === "user" ? m.content : (<>
                    {m.note && <p className="mb-2 text-xs text-[var(--mute)]">{m.note}</p>}
                    {m.error ? <p className="rounded-xl border border-red-500/40 p-3 text-sm text-red-400" role="alert">{m.content}</p>
                      : m.content ? <div className="md"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown></div>
                      : <div className="flex gap-1 py-2" aria-label="Javob yozilmoqda">{[0, 1, 2].map((d) => <span key={d} className="dot h-2 w-2 rounded-full bg-[var(--acc)]" />)}</div>}
                    {!!m.sources?.length && <div className="mt-3 grid gap-2 sm:grid-cols-2">{m.sources.map((s, k) => {
                      let host = ""; try { host = new URL(s.url).hostname.replace("www.", ""); } catch {}
                      return <a key={k} href={s.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3 text-xs hover:border-[var(--acc)]">
                        <div className="font-medium">[{k + 1}] {s.title}</div><div className="text-[var(--mute)]">{host}</div><div className="mt-1 line-clamp-2 text-[var(--mute)]">{s.snippet}</div></a>; })}</div>}
                    {m.content && !busy && !m.error && <div className="mt-2 flex gap-1">
                      <button className={btn} onClick={() => navigator.clipboard.writeText(m.content)}>Nusxa</button>
                      {i === chat.messages.length - 1 && <button className={btn} onClick={regenerate}>Qayta yaratish</button>}</div>}
                  </>)}
                </div>
              </div>))}
            <div ref={end} />
          </div>
        </div>
        <div className="border-t border-[var(--line)] p-3">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-2">
              <textarea aria-label="Xabar" rows={1} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Xohlagan savolingizni bering..."
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none" />
              {busy ? <button onClick={() => abort.current?.abort()} className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm">To'xtatish</button>
                : <button onClick={() => send(input)} disabled={!input.trim()} className="rounded-xl bg-[var(--acc)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40">Yuborish</button>}
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs text-[var(--mute)]"><input type="checkbox" checked={search} onChange={(e) => setSearch(e.target.checked)} />Internetdan qidirish</label>
          </div>
        </div>
      </main>
    </div>
  );
}
