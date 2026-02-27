// src/components/ChatInterface.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Bot, User, Sparkles, ThumbsUp, ThumbsDown,
  Copy, Trash2, AlertCircle, CheckCircle, FileText, Clock,
  Upload, Eye, XCircle, RefreshCw, Download, ExternalLink,
  Plus, MessageSquare, X, Menu, Hash, ArrowUp, Pencil,
  Check, Zap, MoreVertical
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatAPI, documentAPI } from '../services/api';
import { useDocumentContext } from '../context/DocumentContext';

// ─── Helpers ────────────────────────────────────────────────────────────────
const cleanContent = (content) => {
  if (!content) return '';
  let lines = content.split('\n').filter(line => {
    const l = line.toLowerCase();
    return !['document id:', 'score:', 'source:', 'sources:', 'database:', 'search_query:',
      'system log:', 'extracted chunk', 'ai service unavailable', 'internal error:',
      'chunk_index:'].some(k => l.includes(k)) &&
      !['id:', '_id:'].some(k => l.trim().startsWith(k));
  });
  const out = [];
  let inFM = false;
  lines.forEach(line => {
    if (line.trim() === '---') { inFM = !inFM; return; }
    if (inFM) return;
    if (line.trim() !== '' && out[out.length - 1] !== line) out.push(line);
    else if (line.trim() === '' && out.length > 0 && out[out.length - 1].trim() !== '') out.push(line);
  });
  return out.join('\n').trim();
};

const FILE_CONFIG = {
  ALLOWED_TYPES: ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/csv'],
  MAX_SIZE: 50 * 1024 * 1024,
  ACCEPTED_EXTENSIONS: '.pdf,.doc,.docx,.txt,.csv'
};
const fmtSize = (b) => {
  if (!b) return '0 B';
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return (b / Math.pow(1024, i)).toFixed(1) + ' ' + ['B','KB','MB','GB'][i];
};
const validateFile = (f) => {
  if (!FILE_CONFIG.ALLOWED_TYPES.includes(f.type)) return 'PDF, DOC, DOCX, TXT or CSV only';
  if (f.size > FILE_CONFIG.MAX_SIZE) return 'File must be under 50 MB';
  return null;
};
const getErrMsg = (e) => {
  if (e.friendlyMessage) return e.friendlyMessage;
  if (!e.response) return 'Network error or service unavailable.';
  const d = e.response.data;
  return d?.detail || d?.error || d?.message || 'An unexpected error occurred';
};
const getFileUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const p = url.startsWith('/') ? url.slice(1) : url;
  return `http://localhost:8003/${p.startsWith('media/') ? p : 'media/' + p}`;
};

// ─── Inline Rename Input ─────────────────────────────────────────────────────
const RenameInput = ({ value, onSave, onCancel }) => {
  const [v, setV] = useState(value);
  const ref = useRef();
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <div className="flex items-center gap-1 flex-1 min-w-0" onClick={e => e.stopPropagation()}>
      <input
        ref={ref}
        value={v}
        onChange={e => setV(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSave(v); if (e.key === 'Escape') onCancel(); }}
        className="flex-1 min-w-0 text-xs text-white outline-none rounded-md px-2 py-0.5"
        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(16,185,129,0.4)' }}
        maxLength={60}
      />
      <button onClick={() => onSave(v)} className="p-0.5 rounded text-emerald-400 hover:text-emerald-300"><Check className="w-3 h-3" /></button>
      <button onClick={onCancel} className="p-0.5 rounded" style={{ color: 'rgba(255,255,255,0.3)' }}><X className="w-3 h-3" /></button>
    </div>
  );
};

// ─── New Chat Naming Modal ────────────────────────────────────────────────────
const NewChatModal = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState('');
  const ref = useRef();
  useEffect(() => ref.current?.focus(), []);

  const suggestions = ['Lease Agreement Review', 'Maintenance Request', 'Tenant FAQ', 'Property Analysis', 'Inspection Notes'];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(20px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(160deg, #0f1a2e 0%, #090e1a 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.06))', border: '1px solid rgba(16,185,129,0.25)' }}>
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">Name your chat</h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Give it a name to find it later</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <div>
            <input
              ref={ref}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onConfirm(name.trim()); if (e.key === 'Escape') onCancel(); }}
              placeholder="e.g. Lease Agreement Q3 2025"
              maxLength={60}
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(16,185,129,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <p className="text-[10px] mt-1.5 text-right" style={{ color: 'rgba(255,255,255,0.2)' }}>{name.length}/60</p>
          </div>

          {/* Suggestions */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>Quick picks</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map(s => (
                <button key={s} onClick={() => setName(s)}
                  className="px-2.5 py-1 rounded-full text-[11px] transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.42)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.82)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.42)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >{s}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-end gap-2">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}>
            Skip
          </button>
          <button onClick={() => onConfirm(name.trim() || 'New Chat')}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}>
            Start Chat →
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Doc Viewer Modal ─────────────────────────────────────────────────────────
const DocViewerModal = ({ document, onClose }) => {
  if (!document) return null;
  const url = getFileUrl(document.file);
  const isImage = document.file_type?.startsWith('image/');
  const isDoc = document.file_type?.includes('msword') || document.file_type?.includes('wordprocessingml');
  const isText = document.file_type?.includes('text') || document.file_type?.includes('csv');
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(20px)' }}>
      <div className="bg-[#0f1623] rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.09)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white truncate">{document.title || document.file_name}</p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{fmtSize(document.file_size)} · {document.file_type}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent'; }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto min-h-80 flex items-center justify-center p-8"
          style={{ background: 'rgba(0,0,0,0.25)' }}>
          {!url ? (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No preview available</p>
          ) : isImage ? (
            <img src={url} className="max-w-full h-auto rounded-xl shadow-2xl" alt="preview" />
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <FileText className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-white font-semibold mb-1">{isDoc ? 'Word Document' : isText ? 'Text File' : 'Document'}</p>
              <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.4)' }}>{document.title || document.file_name}</p>
              <div className="flex gap-3 justify-center">
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-xl transition-all"
                  style={{ background: '#10b981' }}>
                  <ExternalLink className="w-4 h-4" /> Open
                </a>
                <a href={url} download
                  className="flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Download className="w-4 h-4" /> Download
                </a>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 flex justify-end" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={onClose} className="px-5 py-2 text-sm rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ─── Status Dot ───────────────────────────────────────────────────────────────
const StatusDot = ({ status }) => {
  const cfg = status === 'completed' ? { color: '#10b981', label: 'Ready' }
    : (status === 'processing' || status === 'pending') ? { color: '#f59e0b', label: 'Processing', pulse: true }
      : { color: '#ef4444', label: 'Failed' };
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: cfg.color }}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.pulse ? 'animate-pulse' : ''}`} style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ChatInterface = ({ hasSubscription, onUpgrade }) => {
  const { documents, stats, fetchDocuments, fetchStats } = useDocumentContext();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('chats');
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [conversationLimit, setConversationLimit] = useState({ used: 0, total: hasSubscription ? null : 20 });
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [pendingChatName, setPendingChatName] = useState(null);
  const [renamingId, setRenamingId] = useState(null);

  // Docs state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localError, setLocalError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const initCalledRef = useRef(false);

  const makeWelcome = () => ({
    id: Date.now(), role: 'assistant', timestamp: new Date().toISOString(),
    content: hasSubscription
      ? "Hello! I'm your **TenantIQ AI assistant**. Upload documents in the **Docs** tab and I'll answer your questions with full context."
      : "Hello! I'm your **TenantIQ AI assistant**. **Upgrade to Premium** to upload documents and get personalized, context-aware answers.",
  });

  useEffect(() => {
    if (initCalledRef.current) return;
    initCalledRef.current = true;
    initChat();
    if (hasSubscription) { fetchDocuments(); fetchStats(); }
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [inputMessage]);

  const initChat = async () => {
    try {
      const res = await chatAPI.getConversations();
      const convs = res.data?.results || res.data || [];
      if (Array.isArray(convs) && convs.length > 0) {
        setConversations(convs);
        const latest = convs[0];
        setCurrentConversationId(latest.id);
        try {
          const mRes = await chatAPI.getChatHistory(latest.id);
          const msgs = mRes.data?.results || mRes.data?.messages || mRes.data || [];
          if (Array.isArray(msgs) && msgs.length > 0) {
            setMessages(msgs.map(m => ({ id: m.id, role: m.role, content: m.content, timestamp: m.timestamp || m.created_at, sources: m.sources || [] })));
            return;
          }
        } catch (_) {}
      }
    } catch (_) {}
    setMessages([makeWelcome()]);
  };

  const refreshConvs = async () => {
    try {
      const r = await chatAPI.getConversations();
      setConversations(r.data?.results || r.data || []);
    } catch (_) {}
  };

  const handleNewChatClick = () => setShowNewChatModal(true);

  const handleNewChatConfirm = async (name) => {
    setShowNewChatModal(false);
    try { if (currentConversationId) await chatAPI.deleteConversation(currentConversationId).catch(() => {}); } catch (_) {}
    setCurrentConversationId(null);
    setSelectedDocument(null);
    setMessages([makeWelcome()]);
    setPendingChatName(name);
    await refreshConvs();
  };

  const loadConversation = async (conv) => {
    try {
      setCurrentConversationId(conv.id);
      const r = await chatAPI.getChatHistory(conv.id);
      const msgs = r.data?.results || r.data?.messages || r.data || [];
      setMessages(Array.isArray(msgs) && msgs.length > 0
        ? msgs.map(m => ({ id: m.id, role: m.role, content: m.content, timestamp: m.timestamp || m.created_at, sources: m.sources || [] }))
        : [makeWelcome()]);
      setShowSidebar(false);
    } catch (_) {}
  };

  const deleteConversation = async (conv) => {
    try {
      await chatAPI.deleteConversation(conv.id);
      setConversations(prev => prev.filter(c => c.id !== conv.id));
      if (currentConversationId === conv.id) { setCurrentConversationId(null); setMessages([makeWelcome()]); }
    } catch (_) {}
  };

  const handleRename = async (convId, newName) => {
    setRenamingId(null);
    try { await chatAPI.updateConversation?.(convId, { title: newName }); } catch (_) {}
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, title: newName } : c));
  };

  // Docs
  const handleFileSelect = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const err = validateFile(file);
    if (err) { setLocalError(err); e.target.value = ''; return; }
    setSelectedFile(file); setLocalError(null);
  };
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true); setUploadProgress(0); setLocalError(null); setSuccessMessage(null);
    const fd = new FormData();
    fd.append('file', selectedFile);
    fd.append('title', selectedFile.name.replace(/\.[^/.]+$/, ''));
    try {
      await documentAPI.create(fd, e => setUploadProgress(Math.round(e.loaded * 100 / e.total)));
      setSelectedFile(null);
      const fi = document.getElementById('file-upload-input');
      if (fi) fi.value = '';
      setSuccessMessage('Document uploaded!');
      setTimeout(() => setSuccessMessage(null), 5000);
      await fetchDocuments(); await fetchStats();
    } catch (e) { setLocalError(getErrMsg(e)); }
    finally { setUploading(false); }
  };
  const handleDeleteDoc = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await documentAPI.delete(id);
      if (selectedDocument?.id === id) setSelectedDocument(null);
      setSuccessMessage('Deleted'); setTimeout(() => setSuccessMessage(null), 3000);
      await fetchDocuments(); await fetchStats();
    } catch (e) { setLocalError(getErrMsg(e)); }
  };
  const handleViewDoc = (doc) => {
    if (doc.file_type?.includes('pdf')) window.open(getFileUrl(doc.file), '_blank', 'noopener');
    else setViewingDoc(doc);
  };

  // Send
  const handleSend = async () => {
    if (!inputMessage.trim() || loading) return;
    if (!hasSubscription && conversationLimit.used >= conversationLimit.total) { onUpgrade?.(); return; }

    const userMsg = { id: Date.now(), role: 'user', content: inputMessage, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    const text = inputMessage;
    setInputMessage('');
    setLoading(true);

    try {
      const res = await chatAPI.sendMessage(text, currentConversationId);
      if (res.data.conversation_id && !currentConversationId) {
        const newId = res.data.conversation_id;
        setCurrentConversationId(newId);
        if (pendingChatName) {
          try { await chatAPI.updateConversation?.(newId, { title: pendingChatName }); } catch (_) {}
          setPendingChatName(null);
        }
        await refreshConvs();
      }
      setMessages(prev => [...prev, {
        id: res.data.message_id || Date.now() + 1,
        role: 'assistant', content: res.data.response,
        timestamp: new Date().toISOString(),
        sources: res.data.sources || [], hasContext: res.data.has_context || false,
      }]);
      if (!hasSubscription) setConversationLimit(prev => ({ ...prev, used: prev.used + 1 }));
    } catch (e) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'assistant', isError: true,
        timestamp: new Date().toISOString(),
        content: e?.response?.status === 429 ? "Too many requests. Please wait a moment."
          : e.response?.data?.error || e.response?.data?.detail || 'Sorry, something went wrong.',
      }]);
    } finally { setLoading(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const copy = async (t) => { try { await navigator.clipboard.writeText(t); } catch (_) {} };
  const feedback = async (id, f) => {
    try { await chatAPI.submitFeedback(id, f); setMessages(p => p.map(m => m.id === id ? { ...m, feedback: f } : m)); } catch (_) {}
  };

  const docsReady = stats?.documents?.completed ?? 0;
  const totalChunks = stats?.documents?.total_chunks ?? 0;
  const readyDocs = documents.filter(d => d.indexing_status === 'completed');
  const disabled = (!hasSubscription && conversationLimit.used >= conversationLimit.total) || loading;
  const limitPct = hasSubscription ? 0 : (conversationLimit.used / conversationLimit.total) * 100;
  const nearLimit = !hasSubscription && conversationLimit.used >= conversationLimit.total - 5;
  const currentConvTitle = conversations.find(c => c.id === currentConversationId)?.title || pendingChatName || null;

  return (
    <div className="flex h-full relative overflow-hidden" style={{ fontFamily: "'DM Sans', 'Outfit', ui-sans-serif, sans-serif", background: '#07090f' }}>

      {/* ── Ambient atmosphere ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/3 w-[500px] h-[500px] rounded-full opacity-[0.055]"
          style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 65%)', filter: 'blur(60px)' }} />
        <div className="absolute -bottom-32 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.035]"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 65%)', filter: 'blur(50px)' }} />
        <div className="absolute inset-0 opacity-[0.4]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.012) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      </div>

      {showNewChatModal && <NewChatModal onConfirm={handleNewChatConfirm} onCancel={() => setShowNewChatModal(false)} />}
      <DocViewerModal document={viewingDoc} onClose={() => setViewingDoc(null)} />

      {/* Mobile overlay */}
      {showSidebar && <div className="fixed inset-0 bg-black/60 z-[50] lg:hidden" onClick={() => setShowSidebar(false)} />}

      {/* ══════════════ SIDEBAR ══════════════ */}
      {hasSubscription && (
        <aside
          className={`fixed inset-y-0 left-0 w-64 z-[60] lg:static lg:z-auto flex flex-col transition-transform duration-300 ease-out ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
          style={{ background: 'linear-gradient(180deg, #0c1322 0%, #09101e 100%)', borderRight: '1px solid rgba(255,255,255,0.055)' }}
        >
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 0 14px rgba(16,185,129,0.4)' }}>
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold tracking-tight" style={{ color: 'rgba(255,255,255,0.8)' }}>TenantIQ</span>
            </div>
            <button onClick={() => setShowSidebar(false)} className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg transition-all" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat button */}
          <div className="px-3 pt-3 pb-2">
            <button onClick={handleNewChatClick}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.14), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.22)', color: '#6ee7b7' }}>
              <div className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                style={{ background: 'rgba(16,185,129,0.2)' }}>
                <Plus className="w-3 h-3 text-emerald-400" />
              </div>
              New Chat
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-3 pb-2">
            {[{ id: 'chats', icon: MessageSquare, label: 'Chats' }, { id: 'docs', icon: FileText, label: 'Docs', badge: documents.length }].map(t => (
              <button key={t.id} onClick={() => setSidebarTab(t.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: sidebarTab === t.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: sidebarTab === t.id ? 'white' : 'rgba(255,255,255,0.35)',
                }}>
                <t.icon className="w-3 h-3" />
                {t.label}
                {t.badge > 0 && (
                  <span className="w-4 h-4 text-[9px] font-bold flex items-center justify-center rounded-full"
                    style={{ background: 'rgba(16,185,129,0.18)', color: '#10b981' }}>{t.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto px-3 pb-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>

            {/* CHATS TAB */}
            {sidebarTab === 'chats' && (
              <div className="pt-1">
                {conversations.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-10 h-10 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                      <MessageSquare className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.15)' }} />
                    </div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>No conversations yet</p>
                    <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.15)' }}>Click New Chat to begin</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {conversations.map(conv => (
                      <div key={conv.id} onClick={() => loadConversation(conv)}
                        className="group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150"
                        style={{
                          background: currentConversationId === conv.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                          borderLeft: `2px solid ${currentConversationId === conv.id ? '#10b981' : 'transparent'}`,
                        }}>
                        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }} />
                        {renamingId === conv.id ? (
                          <RenameInput value={conv.title || 'New Chat'} onSave={n => handleRename(conv.id, n)} onCancel={() => setRenamingId(null)} />
                        ) : (
                          <>
                            <span className="text-xs font-medium truncate flex-1 transition-colors"
                              style={{ color: currentConversationId === conv.id ? 'white' : 'rgba(255,255,255,0.45)' }}>
                              {conv.title || 'New Chat'}
                            </span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={e => { e.stopPropagation(); setRenamingId(conv.id); }}
                                className="w-5 h-5 flex items-center justify-center rounded transition-all"
                                style={{ color: 'rgba(255,255,255,0.3)' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                                <Pencil className="w-2.5 h-2.5" />
                              </button>
                              <button onClick={e => { e.stopPropagation(); deleteConversation(conv); }}
                                className="w-5 h-5 flex items-center justify-center rounded transition-all"
                                style={{ color: 'rgba(255,255,255,0.3)' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DOCS TAB */}
            {sidebarTab === 'docs' && (
              <div className="space-y-4 pt-1">
                {localError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-red-300 flex-1">{localError}</p>
                    <button onClick={() => setLocalError(null)} style={{ color: 'rgba(239,68,68,0.5)' }}><X className="w-3 h-3" /></button>
                  </div>
                )}
                {successMessage && (
                  <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-emerald-300 flex-1">{successMessage}</p>
                    <button onClick={() => setSuccessMessage(null)} style={{ color: 'rgba(16,185,129,0.5)' }}><X className="w-3 h-3" /></button>
                  </div>
                )}

                {stats && (
                  <div className="grid grid-cols-2 gap-2">
                    {[{ label: 'Sources', val: docsReady }, { label: 'Vectors', val: totalChunks }].map(s => (
                      <div key={s.label} className="p-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{s.label}</p>
                        <p className="text-xl font-bold text-white">{s.val}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload */}
                <div className="p-4 rounded-xl space-y-3"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.22)' }}>Upload Document</p>
                  <input id="file-upload-input" type="file" onChange={handleFileSelect} accept={FILE_CONFIG.ACCEPTED_EXTENSIONS} className="hidden" />
                  <label htmlFor="file-upload-input"
                    className="flex flex-col items-center gap-2.5 w-full py-5 rounded-xl cursor-pointer transition-all"
                    style={{ border: '2px dashed rgba(255,255,255,0.08)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <Upload className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-medium block" style={{ color: 'rgba(255,255,255,0.42)' }}>{selectedFile ? selectedFile.name : 'Choose file'}</span>
                      <span className="text-[10px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.2)' }}>PDF · DOC · TXT · CSV</span>
                    </div>
                  </label>
                  {uploading ? (
                    <div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #10b981, #059669)' }} />
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Uploading…</span>
                        <span className="text-[10px] font-semibold text-emerald-400">{uploadProgress}%</span>
                      </div>
                    </div>
                  ) : (
                    <button onClick={handleUpload} disabled={!selectedFile}
                      className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none"
                      style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
                      Upload & Train AI
                    </button>
                  )}
                </div>

                {/* Doc list */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>Library</p>
                  {documents.length === 0 ? (
                    <div className="py-8 text-center rounded-xl" style={{ border: '1px dashed rgba(255,255,255,0.07)' }}>
                      <FileText className="w-7 h-7 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.1)' }} />
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>No documents yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {documents.map(doc => {
                        const ready = doc.indexing_status === 'completed';
                        const sel = selectedDocument?.id === doc.id;
                        return (
                          <div key={doc.id} onClick={() => ready && setSelectedDocument(sel ? null : doc)}
                            className="group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150"
                            style={{
                              background: sel ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.02)',
                              border: sel ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.05)',
                            }}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: sel ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.05)' }}>
                              <FileText className={`w-3.5 h-3.5 ${sel ? 'text-emerald-400' : ''}`} style={!sel ? { color: 'rgba(255,255,255,0.25)' } : {}} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate" style={{ color: sel ? 'white' : 'rgba(255,255,255,0.6)' }}>{doc.title || doc.file_name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{fmtSize(doc.file_size)}</span>
                                <StatusDot status={doc.indexing_status} />
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={e => { e.stopPropagation(); handleViewDoc(doc); }}
                                className="w-6 h-6 flex items-center justify-center rounded transition-all"
                                style={{ color: 'rgba(255,255,255,0.25)' }}
                                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'transparent'; }}>
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={e => { e.stopPropagation(); handleDeleteDoc(doc.id, doc.title || doc.file_name); }}
                                className="w-6 h-6 flex items-center justify-center rounded transition-all"
                                style={{ color: 'rgba(255,255,255,0.25)' }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'transparent'; }}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ══════════════ MAIN CHAT ══════════════ */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* Top bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 sticky top-0 z-10"
          style={{ background: 'rgba(7,9,15,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
          <div className="flex items-center gap-3">
            {hasSubscription && (
              <button onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)' }}>
                <Menu className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                  style={{
                    borderColor: '#07090f',
                    background: loading ? '#f59e0b' : '#10b981',
                    boxShadow: `0 0 6px ${loading ? '#f59e0b' : '#10b981'}`,
                  }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-white leading-none">AI Assistant</h2>
                  {currentConvTitle && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                      <Hash className="w-2.5 h-2.5" />
                      {currentConvTitle}
                    </span>
                  )}
                </div>
                <p className="text-[10px] mt-0.5 leading-none"
                  style={{ color: loading ? '#f59e0b' : 'rgba(255,255,255,0.3)' }}>
                  {loading ? 'Thinking…' : selectedDocument ? `Context: ${selectedDocument.title || selectedDocument.file_name}` : 'Ready'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!hasSubscription && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{conversationLimit.used}/{conversationLimit.total}</span>
                <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${limitPct}%`, background: limitPct > 80 ? '#f59e0b' : '#10b981' }} />
                </div>
              </div>
            )}
            <button onClick={handleNewChatClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New chat</span>
            </button>
            {!hasSubscription && (
              <button onClick={onUpgrade}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }}>
                <Zap className="w-3 h-3" /> Upgrade
              </button>
            )}
          </div>
        </header>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.07) transparent' }}>
          <div className="max-w-2xl mx-auto space-y-6">
            {messages.map((msg, i) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                style={{ animation: `msgIn 0.3s cubic-bezier(0.16,1,0.3,1) ${i * 35}ms both` }}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                      background: msg.role === 'user' ? 'rgba(16,185,129,0.12)' : msg.isError ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                      border: msg.role === 'user' ? '1px solid rgba(16,185,129,0.22)' : '1px solid rgba(255,255,255,0.08)',
                    }}>
                    {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-emerald-400" />
                      : msg.isError ? <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        : <Bot className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                </div>

                {/* Bubble + meta */}
                <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                  <div
                    className="inline-block max-w-[90%] sm:max-w-[82%] px-4 py-3.5 text-sm leading-relaxed"
                    style={{
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.13), rgba(16,185,129,0.06))'
                        : msg.isError ? 'rgba(239,68,68,0.06)'
                          : msg.isUpgradePrompt ? 'rgba(245,158,11,0.06)'
                            : 'rgba(255,255,255,0.04)',
                      border: msg.role === 'user' ? '1px solid rgba(16,185,129,0.2)'
                        : msg.isError ? '1px solid rgba(239,68,68,0.14)'
                          : msg.isUpgradePrompt ? '1px solid rgba(245,158,11,0.14)'
                            : '1px solid rgba(255,255,255,0.07)',
                      borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                      color: msg.isError ? '#fca5a5' : msg.isUpgradePrompt ? '#fcd34d' : 'rgba(255,255,255,0.88)',
                    }}>
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ node, ...p }) => <a {...p} className="text-emerald-400 hover:text-emerald-300 underline" target="_blank" rel="noopener noreferrer" />,
                          ul: ({ node, ...p }) => <ul {...p} className="list-disc pl-4 space-y-1.5 my-2" />,
                          ol: ({ node, ...p }) => <ol {...p} className="list-decimal pl-4 space-y-1.5 my-2" />,
                          p: ({ node, ...p }) => <p {...p} className="mb-2 last:mb-0" />,
                          strong: ({ node, ...p }) => <strong {...p} className="font-semibold text-white" />,
                          code: ({ node, inline, ...p }) => inline
                            ? <code {...p} className="px-1.5 py-0.5 rounded font-mono text-[11px] text-emerald-300" style={{ background: 'rgba(16,185,129,0.1)' }} />
                            : <code {...p} className="block p-3.5 rounded-xl font-mono text-xs text-emerald-300 overflow-x-auto my-3 leading-relaxed" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.07)' }} />,
                        }}>{cleanContent(msg.content)}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Timestamp + actions */}
                  <div className={`flex items-center gap-2 mt-1.5 px-1 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.role === 'assistant' && !msg.isError && !msg.isUpgradePrompt && (
                      <div className="flex items-center gap-0.5 transition-opacity"
                        style={{ opacity: 0 }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                        {[
                          { action: () => copy(msg.content), icon: <Copy className="w-3 h-3" />, title: 'Copy' },
                          { action: () => feedback(msg.id, 'like'), icon: <ThumbsUp className="w-3 h-3" />, title: 'Helpful', active: msg.feedback === 'like', activeColor: '#10b981' },
                          { action: () => feedback(msg.id, 'dislike'), icon: <ThumbsDown className="w-3 h-3" />, title: 'Not helpful', active: msg.feedback === 'dislike', activeColor: '#f87171' },
                        ].map((btn, bi) => (
                          <button key={bi} onClick={btn.action} title={btn.title}
                            className="w-6 h-6 flex items-center justify-center rounded transition-all"
                            style={{ color: btn.active ? btn.activeColor : 'rgba(255,255,255,0.25)' }}
                            onMouseEnter={e => !btn.active && (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                            onMouseLeave={e => !btn.active && (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}>
                            {btn.icon}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing */}
            {loading && (
              <div className="flex gap-3 items-start" style={{ animation: 'msgIn 0.3s ease both' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="px-4 py-3.5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px 18px 18px 18px' }}>
                  <div className="flex items-center gap-1.5 h-4">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: '#10b981', opacity: 0.65, animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── Input area ── */}
        <div className="px-4 sm:px-6 py-4 sticky bottom-0"
          style={{ background: 'rgba(7,9,15,0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.055)' }}>
          <div className="max-w-2xl mx-auto space-y-2.5">

            {/* Context pill */}
            {selectedDocument && (
              <div className="flex items-center gap-2 w-fit px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)' }}>
                <Hash className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span className="text-[11px] font-medium text-emerald-300">Context:</span>
                <span className="text-[11px] truncate max-w-[200px]" style={{ color: 'rgba(255,255,255,0.48)' }}>{selectedDocument.title || selectedDocument.file_name}</span>
                <button onClick={() => setSelectedDocument(null)} style={{ color: 'rgba(255,255,255,0.25)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Limit warning */}
            {nearLimit && (
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <p className="text-xs" style={{ color: 'rgba(253,230,138,0.8)' }}>
                    {conversationLimit.used >= conversationLimit.total ? 'Message limit reached.' : `${conversationLimit.total - conversationLimit.used} messages remaining`}
                  </p>
                </div>
                <button onClick={onUpgrade} className="text-xs font-semibold text-amber-400 hover:text-amber-300 ml-4 whitespace-nowrap transition-colors">Upgrade →</button>
              </div>
            )}

            {/* Quick prompts */}
            {hasSubscription && readyDocs.length > 0 && messages.length <= 1 && (
              <div className="flex flex-wrap gap-1.5">
                {['Summarize all documents', 'Key findings?', 'List action items', 'Identify risks'].map((p, i) => (
                  <button key={i} onClick={() => setInputMessage(p)}
                    className="px-3 py-1.5 rounded-full text-xs transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.38)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.78)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.38)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Textarea */}
            <div
              className={`flex items-end gap-2.5 px-4 py-3 rounded-2xl transition-all duration-200 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.28)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
            >
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={handleKey}
                placeholder={disabled && !loading ? 'Upgrade to continue…' : hasSubscription ? 'Ask about your documents…' : 'Ask me anything…'}
                rows={1}
                disabled={disabled}
                className="flex-1 bg-transparent text-sm text-white outline-none resize-none leading-relaxed min-h-[24px] max-h-40"
                style={{ scrollbarWidth: 'none', fontFamily: 'inherit', color: 'rgba(255,255,255,0.88)' }}
              />
              <button onClick={handleSend} disabled={!inputMessage.trim() || disabled}
                className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl transition-all duration-150 disabled:pointer-events-none"
                style={{
                  background: inputMessage.trim() && !disabled ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.07)',
                  color: inputMessage.trim() && !disabled ? '#fff' : 'rgba(255,255,255,0.2)',
                  boxShadow: inputMessage.trim() && !disabled ? '0 4px 16px rgba(16,185,129,0.35)' : 'none',
                }}>
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowUp className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.14)' }}>
              AI can make mistakes · Always verify important information
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;