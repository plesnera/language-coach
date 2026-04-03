import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { HandDrawnButton } from '../../components/HandDrawnButton';
import { HandDrawnCard } from '../../components/HandDrawnCard';
import { HandDrawnInput } from '../../components/HandDrawnInput';
import { SquigglyLine } from '../../components/DoodleDecorations';
import { API_BASE } from '../../config/endpoints';

const PROMPT_TYPES = ['router', 'beginner', 'topic', 'freestyle', 'summarisation'];

interface Language { id: string; name: string; enabled: boolean; }
interface Prompt {
  id: string;
  language_id: string;
  type: string;
  name: string;
  prompt_text: string;
  is_active: boolean;
}

export function AdminPromptsPage() {
  const { user } = useAuth();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${user?.token}`,
    'Content-Type': 'application/json',
  };

  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLangId, setSelectedLangId] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<Partial<Prompt>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/languages`, { headers });
        if (res.ok) {
          const langs: Language[] = await res.json();
          setLanguages(langs);
          if (langs.length > 0) setSelectedLangId(langs[0].id);
        }
      } catch (err) { console.error('Failed to load languages', err); }
      finally { setLoading(false); }
    })();
  }, [user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPrompts = useCallback(async () => {
    if (!selectedLangId) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/prompts?language_id=${selectedLangId}`, { headers });
      if (res.ok) setPrompts(await res.json());
    } catch (err) { console.error('Failed to load prompts', err); }
  }, [selectedLangId, user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadPrompts(); }, [loadPrompts]);

  const handleOpenModal = (prompt?: Prompt) => {
    if (prompt) {
      setCurrentPrompt(prompt);
    } else {
      setCurrentPrompt({ language_id: selectedLangId ?? '', type: 'router', is_active: false });
    }
    setIsModalOpen(true);
  };
  const handleCloseModal = () => { setIsModalOpen(false); setCurrentPrompt({}); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (currentPrompt.id) {
        await fetch(`${API_BASE}/api/admin/prompts/${currentPrompt.id}`, {
          method: 'PUT', headers,
          body: JSON.stringify({ name: currentPrompt.name, prompt_text: currentPrompt.prompt_text }),
        });
      } else {
        await fetch(`${API_BASE}/api/admin/prompts`, {
          method: 'POST', headers,
          body: JSON.stringify({
            language_id: currentPrompt.language_id || selectedLangId,
            type: currentPrompt.type,
            name: currentPrompt.name || '',
            prompt_text: currentPrompt.prompt_text || '',
            is_active: currentPrompt.is_active || false,
          }),
        });
      }
      await loadPrompts();
      handleCloseModal();
    } catch (err) { console.error('Failed to save prompt', err); }
    finally { setSaving(false); }
  };

  const handleActivate = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/admin/prompts/${id}/activate`, { method: 'POST', headers });
      await loadPrompts();
    } catch (err) { console.error('Failed to activate prompt', err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    try {
      await fetch(`${API_BASE}/api/admin/prompts/${id}`, { method: 'DELETE', headers });
      await loadPrompts();
    } catch (err) { console.error('Failed to delete prompt', err); }
  };

  // Group prompts by type
  const groupedPrompts = prompts.reduce((acc, prompt) => {
    if (!acc[prompt.type]) acc[prompt.type] = [];
    acc[prompt.type].push(prompt);
    return acc;
  }, {} as Record<string, Prompt[]>);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="relative inline-block">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A1A]">System Prompts</h1>
          <SquigglyLine className="absolute -bottom-2 left-0 w-full h-2 text-[#1A1A1A]" />
        </div>
        <HandDrawnButton variant="primary" onClick={() => handleOpenModal()} className="shrink-0">
          <Plus size={18} /> Add Prompt
        </HandDrawnButton>
      </div>

      {languages.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {languages.map((lang) => (
            <button key={lang.id} onClick={() => setSelectedLangId(lang.id)}
              className={`px-4 py-2 border-2 border-[#1A1A1A] hand-drawn-border-alt font-medium text-sm transition-colors ${selectedLangId === lang.id ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#1A1A1A] hover:bg-gray-50'}`}>
              {lang.name}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(groupedPrompts).map(([type, typePrompts]) => (
          <div key={type} className="bg-white border-2 border-[#1A1A1A] hand-drawn-border-alt hand-drawn-shadow overflow-hidden">
            <div className="bg-[#FAFAF8] p-4 border-b-2 border-[#1A1A1A] flex items-center gap-2">
              <FileText size={20} />
              <h2 className="font-heading font-bold text-xl capitalize">{type} Prompts</h2>
            </div>
            <div className="p-4 space-y-4">
              {typePrompts.map((prompt) => (
                <div key={prompt.id} className={`p-4 border-2 border-[#1A1A1A] hand-drawn-border ${prompt.is_active ? 'bg-[#10B981]/10 border-[#10B981]' : 'bg-white'}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg">{prompt.name}</h3>
                      {prompt.is_active && (
                        <span className="text-xs font-bold px-2 py-1 bg-[#10B981] text-white hand-drawn-border-pill border-2 border-[#1A1A1A]">ACTIVE</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!prompt.is_active && (
                        <button onClick={() => handleActivate(prompt.id)}
                          className="text-sm font-bold px-3 py-1 border-2 border-[#1A1A1A] hand-drawn-border-pill hover:bg-gray-100 transition-colors">
                          Activate
                        </button>
                      )}
                      <button onClick={() => handleOpenModal(prompt)}
                        className="p-1.5 hover:bg-gray-200 rounded-full transition-colors border-2 border-transparent hover:border-[#1A1A1A] hand-drawn-border">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(prompt.id)}
                        className="p-1.5 hover:bg-red-100 text-[#DC2626] rounded-full transition-colors border-2 border-transparent hover:border-[#DC2626] hand-drawn-border">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-mono text-gray-600 bg-gray-50 p-3 border-2 border-dashed border-gray-200 hand-drawn-border-alt line-clamp-4">
                    {prompt.prompt_text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {prompts.length === 0 && (
          <div className="text-center p-12 border-2 border-dashed border-gray-300 hand-drawn-border text-gray-500">
            No prompts found. Click "Add Prompt" to create one.
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <HandDrawnCard className="w-full max-w-2xl bg-white my-8" rotate="none">
            <h2 className="font-heading text-2xl font-bold mb-6">
              {currentPrompt.id ? 'Edit Prompt' : 'Create New Prompt'}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <HandDrawnInput label="Prompt Name" value={currentPrompt.name || ''} onChange={(e) => setCurrentPrompt({ ...currentPrompt, name: e.target.value })} placeholder="e.g., Router v2" />
                <div className="flex flex-col gap-2">
                  <label className="font-heading font-bold text-[#1A1A1A] text-lg">Type</label>
                  <select
                    className="w-full bg-transparent border-2 border-[#1A1A1A] hand-drawn-border-alt px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                    value={currentPrompt.type || 'router'}
                    disabled={!!currentPrompt.id}
                    onChange={(e) => setCurrentPrompt({ ...currentPrompt, type: e.target.value })}
                  >
                    {PROMPT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {!currentPrompt.id && (
                <div className="flex flex-col gap-2">
                  <label className="font-heading font-bold text-[#1A1A1A] text-lg">Language</label>
                  <select
                    className="w-full bg-transparent border-2 border-[#1A1A1A] hand-drawn-border-alt px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                    value={currentPrompt.language_id || selectedLangId || ''}
                    onChange={(e) => setCurrentPrompt({ ...currentPrompt, language_id: e.target.value })}
                  >
                    {languages.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              )}

              <HandDrawnInput label="Prompt Text" multiline rows={8} value={currentPrompt.prompt_text || ''} onChange={(e) => setCurrentPrompt({ ...currentPrompt, prompt_text: e.target.value })} placeholder="System instructions..." className="font-mono text-sm" />
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <HandDrawnButton variant="outline" onClick={handleCloseModal}>Cancel</HandDrawnButton>
              <HandDrawnButton variant="primary" onClick={handleSave} disabled={!currentPrompt.name || !currentPrompt.prompt_text || saving}>
                {saving ? 'Saving…' : 'Save Prompt'}
              </HandDrawnButton>
            </div>
          </HandDrawnCard>
        </div>
      )}
    </div>
  );
}
export default AdminPromptsPage;
