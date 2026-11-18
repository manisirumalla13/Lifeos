import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import {
  Plus, Search, Pin, PinOff, Trash2, Archive, FolderOpen, Tag,
  Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered,
  Code, Quote, ChevronLeft, FileText, Clock, Edit3, X,
  Paperclip, Upload, Download, ExternalLink, Eye, File, Image as ImageIcon
} from 'lucide-react';

const DEFAULT_FOLDERS = ['All Notes', 'Personal', 'Work', 'Study', 'Ideas'];
const LS_KEY_PREFIX = 'lifeos_notes_';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function createEmptyNote(userId, folder = 'All Notes') {
  return {
    id: generateId(),
    user_id: userId,
    title: '',
    content: '',
    folder,
    tags: '',
    attachments: [],
    is_pinned: false,
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  return tmp.textContent || tmp.innerText || '';
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function highlightText(text, query) {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background: 'rgba(139,92,246,0.4)', color: 'var(--text-primary)', borderRadius: 2, padding: '0 2px' }}>{part}</mark>
      : part
  );
}

/* ─── Quick Capture ────────────────────────────────────────────── */

export function QuickCapture({ session, onClose }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const titleRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            id: generateId(),
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            data: reader.result,
            createdAt: new Date().toISOString(),
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleSave = () => {
    if (!title.trim() && !content.trim() && attachments.length === 0) return;
    const note = createEmptyNote(session.user.id, 'All Notes');
    note.title = title.trim() || 'Untitled Note';
    note.content = content.trim();
    note.attachments = attachments;

    // persist to localStorage
    const key = LS_KEY_PREFIX + session.user.id;
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift(note);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch { /* ignore */ }

    // attempt supabase
    supabase.from('notes').insert([note]).then(() => {});

    if (onClose) onClose(note);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose && onClose(null);
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
  };

  return (
    <div style={styles.qcOverlay} onClick={() => onClose && onClose(null)}>
      <div style={styles.qcModal} onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div style={styles.qcHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Edit3 size={16} style={{ color: 'var(--accent-purple)' }} />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Quick Capture</span>
          </div>
          <button onClick={() => onClose && onClose(null)} style={styles.iconBtn}><X size={16} /></button>
        </div>
        <input
          ref={titleRef}
          type="text"
          placeholder="Title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={styles.qcInput}
        />
        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={styles.qcTextarea}
          rows={4}
        />

        {/* Attachment chips in Quick Capture */}
        {attachments.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '8px 0' }}>
            {attachments.map((att) => (
              <span
                key={att.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  background: 'rgba(139,92,246,0.15)',
                  color: 'var(--accent-purple)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  maxWidth: 200,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <Paperclip size={10} />
                {att.name}
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                  style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'transparent',
              border: '1px solid var(--card-border)',
              color: 'var(--text-secondary)',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <Paperclip size={13} /> Attach File
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onClose && onClose(null)} style={styles.btnSecondary}>Cancel</button>
            <button onClick={handleSave} style={styles.btnPrimary}>
              <Plus size={14} /> Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Format Toolbar ───────────────────────────────────────────── */

function FormatToolbar({ onAttach }) {
  const exec = (cmd, value) => {
    document.execCommand(cmd, false, value || null);
  };

  const btns = [
    { icon: <Bold size={15} />, action: () => exec('bold'), title: 'Bold (Ctrl+B)' },
    { icon: <Italic size={15} />, action: () => exec('italic'), title: 'Italic (Ctrl+I)' },
    { sep: true },
    { icon: <Heading1 size={15} />, action: () => exec('formatBlock', 'h1'), title: 'Heading 1' },
    { icon: <Heading2 size={15} />, action: () => exec('formatBlock', 'h2'), title: 'Heading 2' },
    { icon: <Heading3 size={15} />, action: () => exec('formatBlock', 'h3'), title: 'Heading 3' },
    { sep: true },
    { icon: <List size={15} />, action: () => exec('insertUnorderedList'), title: 'Bullet List' },
    { icon: <ListOrdered size={15} />, action: () => exec('insertOrderedList'), title: 'Numbered List' },
    { sep: true },
    { icon: <Code size={15} />, action: () => exec('formatBlock', 'pre'), title: 'Code Block' },
    { icon: <Quote size={15} />, action: () => exec('formatBlock', 'blockquote'), title: 'Blockquote' },
    ...(onAttach ? [
      { sep: true },
      { icon: <Paperclip size={15} />, action: onAttach, title: 'Attach Files (from Desktop / Mobile)' },
    ] : []),
  ];

  return (
    <div style={styles.toolbar}>
      {btns.map((b, i) =>
        b.sep
          ? <div key={i} style={styles.toolbarSep} />
          : <button key={i} onMouseDown={(e) => { e.preventDefault(); b.action(); }} style={styles.toolbarBtn} title={b.title}>{b.icon}</button>
      )}
    </div>
  );
}

/* ─── Main Notes Component ─────────────────────────────────────── */

export default function Notes({ session }) {
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState('All Notes');
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [mobileShowEditor, setMobileShowEditor] = useState(false);
  const [customFolder, setCustomFolder] = useState('');
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const editorRef = useRef(null);
  const saveTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const userId = session.user.id;

  // Load notes on mount
  useEffect(() => {
    const loadNotes = async () => {
      // Try supabase first
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setNotes(data);
        persistLocal(data);
      } else {
        // Fall back to localStorage
        try {
          const stored = JSON.parse(localStorage.getItem(LS_KEY_PREFIX + userId) || '[]');
          setNotes(stored);
        } catch {
          setNotes([]);
        }
      }
    };
    loadNotes();
  }, [userId]);

  const persistLocal = useCallback((updatedNotes) => {
    try {
      localStorage.setItem(LS_KEY_PREFIX + userId, JSON.stringify(updatedNotes));
    } catch { /* ignore */ }
  }, [userId]);

  const persistSupabase = useCallback(async (note) => {
    try {
      await supabase.from('notes').upsert([note], { onConflict: 'id' });
    } catch { /* silent */ }
  }, []);

  const updateNotes = useCallback((updater) => {
    setNotes((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persistLocal(next);
      return next;
    });
  }, [persistLocal]);

  // Current selected note
  const selectedNote = useMemo(() => notes.find((n) => n.id === selectedId), [notes, selectedId]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // Folder filter
    if (activeFolder === 'Archived') {
      filtered = filtered.filter((n) => n.is_archived);
    } else {
      filtered = filtered.filter((n) => !n.is_archived);
      if (activeFolder !== 'All Notes') {
        filtered = filtered.filter((n) => n.folder === activeFolder);
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((n) =>
        (n.title || '').toLowerCase().includes(q) ||
        stripHtml(n.content || '').toLowerCase().includes(q)
      );
    }

    // Sort: pinned first, then by updated_at
    filtered.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.updated_at) - new Date(a.updated_at);
    });

    return filtered;
  }, [notes, activeFolder, searchQuery]);

  // All unique folders
  const allFolders = useMemo(() => {
    const custom = notes.map((n) => n.folder).filter((f) => f && !DEFAULT_FOLDERS.includes(f));
    return [...new Set([...DEFAULT_FOLDERS, ...custom])];
  }, [notes]);

  // Sync editor content when selection changes
  useEffect(() => {
    if (editorRef.current && selectedNote) {
      if (editorRef.current.innerHTML !== selectedNote.content) {
        editorRef.current.innerHTML = selectedNote.content || '';
      }
    }
  }, [selectedId]); // intentionally only on selectedId change

  // Debounced autosave
  const debouncedSave = useCallback((note) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persistSupabase(note);
    }, 500);
  }, [persistSupabase]);

  // Attachment handlers
  const handleFileUpload = (filesList) => {
    const files = Array.from(filesList || []);
    if (!files.length || !selectedId) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newAttachment = {
          id: generateId(),
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          data: reader.result,
          createdAt: new Date().toISOString(),
        };

        updateNotes((prev) =>
          prev.map((n) =>
            n.id === selectedId
              ? {
                  ...n,
                  attachments: [...(n.attachments || []), newAttachment],
                  updated_at: new Date().toISOString(),
                }
              : n
          )
        );

        const current = notes.find((n) => n.id === selectedId);
        if (current) {
          const updated = {
            ...current,
            attachments: [...(current.attachments || []), newAttachment],
            updated_at: new Date().toISOString(),
          };
          debouncedSave(updated);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleOpenFile = (attachment) => {
    if (!attachment?.data) return;
    setPreviewAttachment(attachment);
  };

  const handleDownloadFile = (attachment) => {
    if (!attachment?.data) return;
    const link = document.createElement('a');
    link.href = attachment.data;
    link.download = attachment.name || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = (attachment) => {
    if (!attachment?.data) return;
    try {
      const arr = attachment.data.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      handleDownloadFile(attachment);
    }
  };

  const handleDeleteAttachment = (attachmentId) => {
    if (!selectedId) return;
    updateNotes((prev) =>
      prev.map((n) =>
        n.id === selectedId
          ? {
              ...n,
              attachments: (n.attachments || []).filter((a) => a.id !== attachmentId),
              updated_at: new Date().toISOString(),
            }
          : n
      )
    );
    const current = notes.find((n) => n.id === selectedId);
    if (current) {
      const updated = {
        ...current,
        attachments: (current.attachments || []).filter((a) => a.id !== attachmentId),
        updated_at: new Date().toISOString(),
      };
      debouncedSave(updated);
    }
  };

  // Handlers
  const handleNewNote = () => {
    const folder = activeFolder === 'All Notes' || activeFolder === 'Archived' ? 'All Notes' : activeFolder;
    const note = createEmptyNote(userId, folder);
    updateNotes((prev) => [note, ...prev]);
    setSelectedId(note.id);
    setMobileShowEditor(true);
    setTimeout(() => editorRef.current?.focus(), 50);
  };

  const handleSelectNote = (id) => {
    setSelectedId(id);
    setMobileShowEditor(true);
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    updateNotes((prev) =>
      prev.map((n) =>
        n.id === selectedId
          ? { ...n, title, updated_at: new Date().toISOString() }
          : n
      )
    );
    const updated = { ...selectedNote, title, updated_at: new Date().toISOString() };
    debouncedSave(updated);
  };

  const handleContentInput = () => {
    if (!editorRef.current || !selectedId) return;
    const content = editorRef.current.innerHTML;
    updateNotes((prev) =>
      prev.map((n) =>
        n.id === selectedId
          ? { ...n, content, updated_at: new Date().toISOString() }
          : n
      )
    );
    const updated = { ...selectedNote, content, updated_at: new Date().toISOString() };
    debouncedSave(updated);
  };

  const handleFolderChange = (folder) => {
    if (!selectedId) return;
    updateNotes((prev) =>
      prev.map((n) =>
        n.id === selectedId
          ? { ...n, folder, updated_at: new Date().toISOString() }
          : n
      )
    );
    const updated = { ...selectedNote, folder, updated_at: new Date().toISOString() };
    persistSupabase(updated);
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value;
    updateNotes((prev) =>
      prev.map((n) =>
        n.id === selectedId
          ? { ...n, tags, updated_at: new Date().toISOString() }
          : n
      )
    );
    const updated = { ...selectedNote, tags, updated_at: new Date().toISOString() };
    debouncedSave(updated);
  };

  const handleTogglePin = () => {
    if (!selectedId) return;
    updateNotes((prev) =>
      prev.map((n) =>
        n.id === selectedId
          ? { ...n, is_pinned: !n.is_pinned, updated_at: new Date().toISOString() }
          : n
      )
    );
    const updated = { ...selectedNote, is_pinned: !selectedNote.is_pinned, updated_at: new Date().toISOString() };
    persistSupabase(updated);
  };

  const handleArchive = () => {
    if (!selectedId) return;
    updateNotes((prev) =>
      prev.map((n) =>
        n.id === selectedId
          ? { ...n, is_archived: !n.is_archived, updated_at: new Date().toISOString() }
          : n
      )
    );
    const updated = { ...selectedNote, is_archived: !selectedNote.is_archived, updated_at: new Date().toISOString() };
    persistSupabase(updated);
    setSelectedId(null);
    setMobileShowEditor(false);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    if (!window.confirm('Delete this note permanently?')) return;
    const id = selectedId;
    setSelectedId(null);
    setMobileShowEditor(false);
    updateNotes((prev) => prev.filter((n) => n.id !== id));
    supabase.from('notes').delete().eq('id', id).then(() => {});
  };

  const handleQuickCaptureClose = (note) => {
    setShowQuickCapture(false);
    if (note) {
      updateNotes((prev) => [note, ...prev]);
      setSelectedId(note.id);
      setMobileShowEditor(true);
    }
  };

  const handleAddCustomFolder = (e) => {
    if (e.key === 'Enter' && customFolder.trim()) {
      setActiveFolder(customFolder.trim());
      setCustomFolder('');
    }
  };

  const handleMobileBack = () => {
    setMobileShowEditor(false);
  };

  // ───── Render ─────

  return (
    <div style={styles.wrapper}>
      {/* LEFT PANEL — Note List */}
      <div style={{ ...styles.leftPanel, ...(mobileShowEditor ? styles.hideMobile : styles.showMobile) }}>
        {/* Window Dots & Header */}
        <div style={{ padding: '14px 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="window-dots">
              <span className="window-dot red" />
              <span className="window-dot yellow" />
              <span className="window-dot green" />
            </div>
            <span style={{ fontSize: '0.68rem', color: '#00f2fe', fontWeight: 700, letterSpacing: '0.05em' }}>
              NEURAL HUB
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={styles.leftTitle}>
              <FileText size={18} style={{ color: '#00f2fe' }} /> Notes & Knowledge
            </h2>
            <button onClick={handleNewNote} style={{ ...styles.newNoteBtn, background: 'linear-gradient(135deg, #00f2fe, #a855f7)' }} title="New Note">
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Holographic Knowledge Neural Graphic Mini-Banner */}
        <div style={{ margin: '10px 12px 6px', padding: '10px 12px', borderRadius: 10, background: 'linear-gradient(135deg, rgba(0,242,254,0.06), rgba(168,85,247,0.08))', border: '1px solid rgba(0,242,254,0.18)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', width: 42, height: 42, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,242,254,0.3) 0%, rgba(168,85,247,0.1) 70%, transparent 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 12px rgba(0,242,254,0.4)' }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="6" stroke="#00f2fe" strokeWidth="1.5" />
              <circle cx="6" cy="8" r="3" fill="#a855f7" />
              <circle cx="26" cy="8" r="3" fill="#ec4899" />
              <circle cx="8" cy="24" r="3" fill="#00f2fe" />
              <circle cx="24" cy="24" r="3" fill="#10b981" />
              <line x1="9" y1="9" x2="13" y2="13" stroke="#00f2fe" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="23" y1="9" x2="19" y2="13" stroke="#a855f7" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="10" y1="23" x2="14" y2="19" stroke="#ec4899" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="22" y1="23" x2="18" y2="19" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>Knowledge Mesh</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
              {notes.length} thoughts • {notes.reduce((acc, n) => acc + (n.attachments?.length || 0), 0)} files stored
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={styles.searchWrap}>
          <Search size={15} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={styles.iconBtnSm}><X size={14} /></button>
          )}
        </div>

        {/* Folder tabs */}
        <div style={styles.folderList}>
          {[...allFolders, 'Archived'].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFolder(f)}
              style={{
                ...styles.folderBtn,
                ...(activeFolder === f ? styles.folderBtnActive : {}),
              }}
            >
              {f === 'Archived' ? <Archive size={13} /> : <FolderOpen size={13} />}
              {f}
            </button>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <input
              type="text"
              placeholder="+ New folder"
              value={customFolder}
              onChange={(e) => setCustomFolder(e.target.value)}
              onKeyDown={handleAddCustomFolder}
              style={styles.customFolderInput}
            />
          </div>
        </div>

        {/* Note List */}
        <div style={styles.noteList}>
          {filteredNotes.length === 0 && (
            <div style={styles.emptyState}>
              <FileText size={36} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
              <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0', fontSize: 13 }}>
                {searchQuery ? 'No matching notes' : 'Start capturing your thoughts...'}
              </p>
            </div>
          )}
          {filteredNotes.map((note) => {
            const preview = stripHtml(note.content).slice(0, 80);
            const isSelected = note.id === selectedId;
            const tags = (note.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
            return (
              <div
                key={note.id}
                onClick={() => handleSelectNote(note.id)}
                style={{
                  ...styles.noteItem,
                  ...(isSelected ? styles.noteItemSelected : {}),
                }}
              >
                <div style={styles.noteItemHeader}>
                  {note.is_pinned && <Pin size={12} style={{ color: 'var(--accent-purple)', flexShrink: 0 }} />}
                  <span style={styles.noteItemTitle}>
                    {searchQuery
                      ? highlightText(note.title || 'Untitled', searchQuery)
                      : (note.title || 'Untitled')}
                  </span>
                </div>
                {preview && (
                  <p style={styles.noteItemPreview}>
                    {searchQuery ? highlightText(preview, searchQuery) : preview}
                  </p>
                )}
                <div style={styles.noteItemMeta}>
                  <span style={styles.noteItemDate}>
                    <Clock size={10} /> {formatDate(note.updated_at)}
                  </span>
                  {note.folder && note.folder !== 'All Notes' && (
                    <span style={styles.folderBadge}>{note.folder}</span>
                  )}
                  {note.attachments && note.attachments.length > 0 && (
                    <span style={styles.attachmentBadge} title={`${note.attachments.length} attached file(s)`}>
                      <Paperclip size={10} /> {note.attachments.length}
                    </span>
                  )}
                  {tags.map((t, i) => (
                    <span key={i} style={styles.tagPill}>{t}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL — Editor */}
      <div style={{ ...styles.rightPanel, ...(mobileShowEditor ? styles.showMobile : styles.hideMobile) }}>
        {selectedNote ? (
          <>
            {/* Editor header */}
            <div style={styles.editorHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={handleMobileBack} style={styles.mobileBackBtn}>
                  <ChevronLeft size={20} />
                </button>
                <div className="window-dots" style={{ margin: 0 }}>
                  <span className="window-dot red" />
                  <span className="window-dot yellow" />
                  <span className="window-dot green" />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  DOCUMENT EDITOR
                </span>
              </div>
              <div style={styles.editorActions}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={styles.iconBtn}
                  title="Attach files (desktop or mobile)"
                >
                  <Paperclip size={16} />
                </button>
                <button onClick={handleTogglePin} style={styles.iconBtn} title={selectedNote.is_pinned ? 'Unpin' : 'Pin'}>
                  {selectedNote.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
                </button>
                <button onClick={handleArchive} style={styles.iconBtn} title={selectedNote.is_archived ? 'Unarchive' : 'Archive'}>
                  <Archive size={16} />
                </button>
                <button onClick={handleDelete} style={{ ...styles.iconBtn, color: '#ef4444' }} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Hidden device file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => {
                handleFileUpload(e.target.files);
                e.target.value = '';
              }}
              style={{ display: 'none' }}
            />

            {/* Title */}
            <input
              type="text"
              placeholder="Note title..."
              value={selectedNote.title}
              onChange={handleTitleChange}
              style={styles.titleInput}
            />

            {/* Meta row: folder + tags */}
            <div style={styles.metaRow}>
              <div style={styles.metaItem}>
                <FolderOpen size={13} style={{ color: 'var(--text-secondary)' }} />
                <select
                  value={selectedNote.folder}
                  onChange={(e) => handleFolderChange(e.target.value)}
                  style={styles.metaSelect}
                >
                  {allFolders.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div style={styles.metaItem}>
                <Tag size={13} style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={selectedNote.tags}
                  onChange={handleTagsChange}
                  style={styles.tagsInput}
                />
              </div>
            </div>

            {/* Attachments Section */}
            <div style={styles.attachmentsSection}>
              <div style={styles.attachmentsHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Paperclip size={13} style={{ color: 'var(--accent-purple)' }} />
                  <span style={styles.attachmentsTitle}>
                    Attachments ({selectedNote.attachments?.length || 0})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={styles.addAttachmentBtn}
                  title="Upload files from desktop or mobile"
                >
                  <Upload size={12} /> Add Files
                </button>
              </div>

              {selectedNote.attachments && selectedNote.attachments.length > 0 ? (
                <div style={styles.attachmentGrid}>
                  {selectedNote.attachments.map((att) => {
                    const isImg = att.type?.startsWith('image/');
                    return (
                      <div key={att.id} style={styles.attachmentCard}>
                        <div
                          style={styles.attachmentThumbWrap}
                          onClick={() => handleOpenFile(att)}
                          title="Click to preview / open"
                        >
                          {isImg ? (
                            <img src={att.data} alt={att.name} style={styles.attachmentThumbImg} />
                          ) : (
                            <FileText size={22} style={{ color: 'var(--accent-purple)' }} />
                          )}
                        </div>
                        <div style={styles.attachmentMeta}>
                          <span style={styles.attachmentName} title={att.name}>{att.name}</span>
                          <span style={styles.attachmentSize}>{formatFileSize(att.size)}</span>
                        </div>
                        <div style={styles.attachmentActions}>
                          <button
                            type="button"
                            onClick={() => handleOpenFile(att)}
                            style={styles.attachmentActionBtn}
                            title="Open / Preview"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(att)}
                            style={styles.attachmentActionBtn}
                            title="Download to device"
                          >
                            <Download size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(att.id)}
                            style={{ ...styles.attachmentActionBtn, color: '#ef4444' }}
                            title="Delete file"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={styles.emptyAttachmentDrop}
                >
                  <Upload size={13} style={{ opacity: 0.6 }} />
                  <span>Click or drop files from desktop/mobile to attach</span>
                </div>
              )}
            </div>

            {/* Format toolbar */}
            <FormatToolbar onAttach={() => fileInputRef.current?.click()} />

            {/* ContentEditable editor with drag-and-drop support */}
            <div
              style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOver(false);
                if (e.dataTransfer?.files?.length) {
                  handleFileUpload(e.dataTransfer.files);
                }
              }}
            >
              {isDraggingOver && (
                <div style={styles.dropOverlay}>
                  <Upload size={32} style={{ color: 'var(--accent-purple)' }} />
                  <p style={{ margin: '8px 0 0', fontWeight: 600, color: '#fff' }}>
                    Drop files here to attach to this note
                  </p>
                </div>
              )}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleContentInput}
                style={styles.editor}
                data-placeholder="Start writing..."
              />
            </div>
          </>
        ) : (
          <div style={styles.emptyEditor}>
            <FileText size={48} style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
            <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: 14 }}>
              Select a note or create a new one
            </p>
            <button onClick={handleNewNote} style={{ ...styles.btnPrimary, marginTop: 16 }}>
              <Plus size={16} /> New Note
            </button>
          </div>
        )}
      </div>

      {/* Floating Quick Capture Button */}
      <button
        onClick={() => setShowQuickCapture(true)}
        style={styles.fab}
        title="Quick Capture"
      >
        <Plus size={22} />
      </button>

      {/* Quick Capture Modal */}
      {showQuickCapture && (
        <QuickCapture session={session} onClose={handleQuickCaptureClose} />
      )}

      {/* File Preview & Open Modal */}
      {previewAttachment && (
        <div style={styles.previewBackdrop} onClick={() => setPreviewAttachment(null)}>
          <div style={styles.previewModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.previewHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, overflow: 'hidden' }}>
                <Paperclip size={16} style={{ color: 'var(--accent-purple)', flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {previewAttachment.name}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>
                  ({formatFileSize(previewAttachment.size)})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => handleDownloadFile(previewAttachment)}
                  style={styles.previewActionBtn}
                  title="Download file to device"
                >
                  <Download size={14} /> Download
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenInNewTab(previewAttachment)}
                  style={styles.previewActionBtn}
                  title="Open file in new tab"
                >
                  <ExternalLink size={14} /> Open in Tab
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  style={styles.iconBtn}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={styles.previewBody}>
              {previewAttachment.type?.startsWith('image/') ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                  <img
                    src={previewAttachment.data}
                    alt={previewAttachment.name}
                    style={styles.previewImage}
                  />
                </div>
              ) : previewAttachment.type === 'application/pdf' ? (
                <iframe
                  src={previewAttachment.data}
                  title={previewAttachment.name}
                  style={styles.previewIframe}
                />
              ) : (
                <div style={styles.previewGeneric}>
                  <FileText size={56} style={{ color: 'var(--accent-purple)', opacity: 0.7, marginBottom: 16 }} />
                  <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                    {previewAttachment.name}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
                    {formatFileSize(previewAttachment.size)} • {previewAttachment.type || 'Document'}
                  </p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(previewAttachment)}
                      style={styles.btnPrimary}
                    >
                      <Download size={15} /> Download File
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenInNewTab(previewAttachment)}
                      style={styles.btnSecondary}
                    >
                      <ExternalLink size={15} /> Open External
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global styles for editor content */}
      <style>{`
        [data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: var(--text-secondary);
          opacity: 0.5;
          pointer-events: none;
        }
        [contenteditable] h1 { font-size: 1.6em; margin: 0.4em 0; font-weight: 700; color: var(--text-primary); }
        [contenteditable] h2 { font-size: 1.3em; margin: 0.4em 0; font-weight: 600; color: var(--text-primary); }
        [contenteditable] h3 { font-size: 1.1em; margin: 0.3em 0; font-weight: 600; color: var(--text-primary); }
        [contenteditable] ul, [contenteditable] ol { padding-left: 1.5em; margin: 0.3em 0; }
        [contenteditable] li { margin: 0.15em 0; }
        [contenteditable] pre {
          background: rgba(0,0,0,0.4); border-radius: 6px; padding: 12px 14px;
          font-family: 'Fira Code', 'Cascadia Code', monospace; font-size: 0.88em;
          overflow-x: auto; margin: 0.4em 0; color: #a5b4fc;
        }
        [contenteditable] blockquote {
          border-left: 3px solid var(--accent-purple); margin: 0.4em 0;
          padding: 4px 14px; color: var(--text-secondary); font-style: italic;
          background: rgba(139,92,246,0.06); border-radius: 0 6px 6px 0;
        }
        [contenteditable]:focus { outline: none; }

        @media (max-width: 767px) {
          .notes-hide-mobile { display: none !important; }
          .notes-show-mobile { display: flex !important; }
        }
        @media (min-width: 768px) {
          .notes-mobile-back { display: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── Styles ───────────────────────────────────────────────────── */

const styles = {
  wrapper: {
    display: 'flex',
    height: 'calc(100vh - 80px)',
    gap: 0,
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid var(--card-border)',
    background: 'var(--card-bg)',
    position: 'relative',
  },

  /* Left panel */
  leftPanel: {
    width: 280,
    minWidth: 280,
    maxWidth: 280,
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(8,10,20,0.75)',
    borderRight: '1px solid var(--card-border)',
    overflow: 'hidden',
  },
  leftHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 16px 8px',
  },
  leftTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  newNoteBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 8,
    border: 'none',
    background: 'var(--accent-purple)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'transform 0.15s',
  },

  /* Search */
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: '8px 12px',
    padding: '8px 10px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--card-border)',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
  },

  /* Folders */
  folderList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '4px 10px 8px',
    borderBottom: '1px solid var(--card-border)',
    maxHeight: 180,
    overflowY: 'auto',
  },
  folderBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 8px',
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    textAlign: 'left',
    whiteSpace: 'nowrap',
  },
  folderBtnActive: {
    background: 'rgba(139,92,246,0.15)',
    color: 'var(--accent-purple)',
    fontWeight: 600,
  },
  customFolderInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 11,
    outline: 'none',
    padding: '4px 8px',
  },

  /* Note list */
  noteList: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 0',
  },
  noteItem: {
    padding: '10px 14px',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    transition: 'background 0.15s',
    ':hover': {},
  },
  noteItemSelected: {
    background: 'rgba(139,92,246,0.1)',
    borderLeft: '3px solid var(--accent-purple)',
  },
  noteItemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  noteItemTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  noteItemPreview: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    margin: '3px 0 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: 1.4,
  },
  noteItemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
    flexWrap: 'wrap',
  },
  noteItemDate: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 10,
    color: 'var(--text-secondary)',
    opacity: 0.7,
  },
  folderBadge: {
    fontSize: 9,
    padding: '1px 6px',
    borderRadius: 4,
    background: 'rgba(59,130,246,0.15)',
    color: 'var(--accent-blue)',
    fontWeight: 500,
  },
  tagPill: {
    fontSize: 9,
    padding: '1px 6px',
    borderRadius: 10,
    background: 'rgba(236,72,153,0.12)',
    color: 'var(--accent-pink)',
    fontWeight: 500,
  },

  /* Right panel */
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
  },
  editorHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px 4px',
    borderBottom: '1px solid var(--card-border)',
  },
  mobileBackBtn: {
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 4,
  },
  editorActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },

  /* Title input */
  titleInput: {
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: 22,
    fontWeight: 700,
    padding: '12px 20px 4px',
    outline: 'none',
    width: '100%',
  },

  /* Meta row */
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '4px 20px 8px',
    flexWrap: 'wrap',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  metaSelect: {
    border: 'none',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    borderRadius: 4,
    padding: '3px 6px',
    outline: 'none',
    cursor: 'pointer',
  },
  tagsInput: {
    border: 'none',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    borderRadius: 4,
    padding: '3px 8px',
    outline: 'none',
    width: 180,
  },

  /* Toolbar */
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '6px 18px',
    borderBottom: '1px solid var(--card-border)',
    flexWrap: 'wrap',
  },
  toolbarBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 28,
    borderRadius: 5,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'background 0.12s, color 0.12s',
  },
  toolbarSep: {
    width: 1,
    height: 18,
    background: 'var(--card-border)',
    margin: '0 4px',
  },

  /* Editor */
  editor: {
    flex: 1,
    padding: '16px 22px',
    color: 'var(--text-primary)',
    fontSize: 14,
    lineHeight: 1.7,
    overflowY: 'auto',
    minHeight: 200,
    outline: 'none',
  },

  /* Empty states */
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 16px',
    textAlign: 'center',
  },
  emptyEditor: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    textAlign: 'center',
  },

  /* Shared buttons */
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'background 0.12s',
  },
  iconBtnSm: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: 4,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: 'var(--gradient-glow)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  btnSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid var(--card-border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 13,
    cursor: 'pointer',
  },

  /* FAB */
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: '50%',
    border: 'none',
    background: 'var(--gradient-glow)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    zIndex: 10,
  },

  /* Quick Capture Modal */
  qcOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  qcModal: {
    background: 'rgba(18,22,36,0.95)',
    border: '1px solid var(--card-border)',
    borderRadius: 14,
    padding: 20,
    width: '90%',
    maxWidth: 420,
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
  },
  qcHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  qcInput: {
    width: '100%',
    border: 'none',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-primary)',
    fontSize: 15,
    fontWeight: 600,
    padding: '10px 12px',
    borderRadius: 8,
    outline: 'none',
    marginBottom: 8,
    boxSizing: 'border-box',
  },
  qcTextarea: {
    width: '100%',
    border: 'none',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-primary)',
    fontSize: 13,
    padding: '10px 12px',
    borderRadius: 8,
    outline: 'none',
    resize: 'vertical',
    lineHeight: 1.6,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },

  /* Mobile helpers */
  hideMobile: {},
  showMobile: {},

  /* Attachments */
  attachmentBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 10,
    padding: '1px 5px',
    borderRadius: 4,
    background: 'rgba(139,92,246,0.15)',
    color: 'var(--accent-purple)',
    fontWeight: 600,
  },
  attachmentsSection: {
    padding: '10px 20px',
    borderBottom: '1px solid var(--card-border)',
    background: 'rgba(0,0,0,0.15)',
  },
  attachmentsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  attachmentsTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  addAttachmentBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(139,92,246,0.15)',
    border: '1px solid rgba(139,92,246,0.3)',
    color: 'var(--accent-purple)',
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  attachmentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 8,
    marginTop: 4,
  },
  attachmentCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 8px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--card-border)',
    overflow: 'hidden',
    position: 'relative',
  },
  attachmentThumbWrap: {
    width: 36,
    height: 36,
    borderRadius: 6,
    background: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    cursor: 'pointer',
  },
  attachmentThumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  attachmentMeta: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flex: 1,
    minWidth: 0,
  },
  attachmentName: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  attachmentSize: {
    fontSize: 10,
    color: 'var(--text-secondary)',
    marginTop: 2,
  },
  attachmentActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  attachmentActionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: 4,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 0,
    transition: 'color 0.12s',
  },
  emptyAttachmentDrop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px dashed var(--card-border)',
    background: 'rgba(255,255,255,0.01)',
    color: 'var(--text-secondary)',
    fontSize: 11,
    cursor: 'pointer',
    textAlign: 'center',
  },
  dropOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(10,12,24,0.88)',
    backdropFilter: 'blur(6px)',
    border: '2px dashed var(--accent-purple)',
    borderRadius: 8,
    zIndex: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },

  /* Preview Modal */
  previewBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: 20,
  },
  previewModal: {
    background: 'rgba(18,22,36,0.98)',
    border: '1px solid var(--card-border)',
    borderRadius: 16,
    width: '90%',
    maxWidth: 880,
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '1px solid var(--card-border)',
    background: 'rgba(0,0,0,0.2)',
  },
  previewActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--card-border)',
    color: 'var(--text-primary)',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  previewBody: {
    flex: 1,
    padding: 20,
    overflowY: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '75vh',
    objectFit: 'contain',
    borderRadius: 8,
    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
  },
  previewIframe: {
    width: '100%',
    height: '75vh',
    border: 'none',
    borderRadius: 8,
  },
  previewGeneric: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
  },
};
