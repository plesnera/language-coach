import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, MessageSquare, Loader2, ImagePlus, Upload, X, Grid3X3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { HandDrawnButton } from '../../components/HandDrawnButton';
import { HandDrawnCard } from '../../components/HandDrawnCard';
import { HandDrawnInput } from '../../components/HandDrawnInput';
import { SquigglyLine } from '../../components/DoodleDecorations';

const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : '';

interface Language { id: string; name: string; enabled: boolean; }
interface Topic {
  id: string;
  language_id: string;
  title: string;
  description: string;
  conversation_prompt: string;
  image_url: string | null;
  sort_order: number;
}
interface LibraryImage { id: string; filename: string; url: string; original_name: string; }

export function AdminTopicsPage() {
  const { user } = useAuth();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${user?.token}`,
    'Content-Type': 'application/json',
  };

  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLangId, setSelectedLangId] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<Partial<Topic>>({});
  const [saving, setSaving] = useState(false);
  const [imageLibrary, setImageLibrary] = useState<LibraryImage[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const loadTopics = useCallback(async () => {
    if (!selectedLangId) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/topics?language_id=${selectedLangId}`, { headers });
      if (res.ok) setTopics(await res.json());
    } catch (err) { console.error('Failed to load topics', err); }
  }, [selectedLangId, user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadTopics(); }, [loadTopics]);

  const loadImageLibrary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/images`, { headers });
      if (res.ok) setImageLibrary(await res.json());
    } catch (err) { console.error('Failed to load image library', err); }
  }, [user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/api/admin/images/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user?.token}` },
        body: formData,
      });
      if (res.ok) {
        const record: LibraryImage = await res.json();
        setImageLibrary((prev) => [record, ...prev]);
        setCurrentTopic((prev) => ({ ...prev, image_url: record.url }));
      }
    } catch (err) { console.error('Failed to upload image', err); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleOpenModal = (topic?: Topic) => {
    setCurrentTopic(topic ? { ...topic } : { language_id: selectedLangId ?? '', description: '', conversation_prompt: '' });
    setShowLibrary(false);
    loadImageLibrary();
    setIsModalOpen(true);
  };
  const handleCloseModal = () => { setIsModalOpen(false); setCurrentTopic({}); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (currentTopic.id) {
        await fetch(`${API_BASE}/api/admin/topics/${currentTopic.id}`, {
          method: 'PUT', headers,
          body: JSON.stringify({ title: currentTopic.title, description: currentTopic.description, conversation_prompt: currentTopic.conversation_prompt, image_url: currentTopic.image_url }),
        });
      } else {
        await fetch(`${API_BASE}/api/admin/topics`, {
          method: 'POST', headers,
          body: JSON.stringify({ language_id: currentTopic.language_id || selectedLangId, title: currentTopic.title || '', description: currentTopic.description || '', conversation_prompt: currentTopic.conversation_prompt || '', sort_order: topics.length, image_url: currentTopic.image_url || null }),
        });
      }
      await loadTopics();
      handleCloseModal();
    } catch (err) { console.error('Failed to save topic', err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;
    try {
      await fetch(`${API_BASE}/api/admin/topics/${id}`, { method: 'DELETE', headers });
      await loadTopics();
    } catch (err) { console.error('Failed to delete topic', err); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="relative inline-block">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A1A]">Topic Management</h1>
          <SquigglyLine className="absolute -bottom-2 left-0 w-full h-2 text-[#F59E0B]" />
        </div>
        <HandDrawnButton variant="primary" onClick={() => handleOpenModal()} className="shrink-0">
          <Plus size={18} /> Add Topic
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topics.map((topic, idx) => (
          <HandDrawnCard key={topic.id} rotate={idx % 2 === 0 ? 'left' : 'right'} className="flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-[#F59E0B]" />
                <h3 className="font-heading text-xl font-bold">{topic.title}</h3>
              </div>
            </div>
            {topic.image_url && (
              <img src={`${API_BASE}${topic.image_url}`} alt="" className="w-full h-32 object-cover rounded border-2 border-[#1A1A1A] mb-4" />
            )}
            <p className="text-gray-600 text-sm mb-4 flex-1">{topic.description}</p>
            <div className="bg-gray-50 p-3 border-2 border-dashed border-gray-300 hand-drawn-border-alt mb-4">
              <p className="text-xs font-mono text-gray-500 line-clamp-2">{topic.conversation_prompt}</p>
            </div>
            <div className="flex justify-end gap-2 mt-auto pt-4 border-t-2 border-dashed border-gray-200">
              <HandDrawnButton variant="outline" onClick={() => handleOpenModal(topic)} className="px-3 py-1.5 text-sm"><Edit2 size={14} /> Edit</HandDrawnButton>
              <HandDrawnButton variant="outline" onClick={() => handleDelete(topic.id)} className="px-3 py-1.5 text-sm text-[#DC2626] hover:bg-red-50 border-transparent hover:border-[#DC2626]"><Trash2 size={14} /> Delete</HandDrawnButton>
            </div>
          </HandDrawnCard>
        ))}
        {topics.length === 0 && (
          <div className="col-span-full text-center p-12 border-2 border-dashed border-gray-300 hand-drawn-border text-gray-500">No topics found. Click &quot;Add Topic&quot; to create one.</div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <HandDrawnCard className="w-full max-w-lg bg-white my-8" rotate="none">
            <h2 className="font-heading text-2xl font-bold mb-6">{currentTopic.id ? 'Edit Topic' : 'Create New Topic'}</h2>
            <div className="space-y-4">
              <HandDrawnInput label="Topic Title" value={currentTopic.title || ''} onChange={(e) => setCurrentTopic({ ...currentTopic, title: e.target.value })} placeholder="e.g., Travel" />
              <HandDrawnInput label="Description" multiline rows={2} value={currentTopic.description || ''} onChange={(e) => setCurrentTopic({ ...currentTopic, description: e.target.value })} placeholder="Brief description visible to users..." />
              <HandDrawnInput label="Conversation Prompt (System)" multiline rows={4} value={currentTopic.conversation_prompt || ''} onChange={(e) => setCurrentTopic({ ...currentTopic, conversation_prompt: e.target.value })} placeholder="Instructions for the AI..." className="font-mono text-sm" />

              <div className="border-t-2 border-dashed border-gray-200 pt-4">
                <h3 className="font-heading font-bold text-lg mb-3 flex items-center gap-2"><ImagePlus size={20} className="text-[#F59E0B]" /> Topic Image</h3>
                {currentTopic.image_url ? (
                  <div className="relative inline-block mb-4">
                    <img src={`${API_BASE}${currentTopic.image_url}`} alt="Topic" className="w-40 h-28 object-cover rounded border-2 border-[#1A1A1A]" />
                    <button type="button" onClick={() => setCurrentTopic({ ...currentTopic, image_url: null })} className="absolute -top-2 -right-2 w-6 h-6 bg-[#DC2626] text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="w-40 h-28 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 mb-4"><ImagePlus size={24} /></div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <label className="inline-flex items-center gap-1 text-sm font-bold px-4 py-2 border-2 border-[#1A1A1A] hand-drawn-border-alt cursor-pointer hover:bg-gray-100 transition-colors">
                    <Upload size={16} /> {uploading ? 'Uploading…' : 'Upload Image'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                  <button type="button" onClick={() => setShowLibrary(!showLibrary)} className="inline-flex items-center gap-1 text-sm font-bold px-4 py-2 border-2 border-[#1A1A1A] hand-drawn-border-alt hover:bg-gray-100 transition-colors">
                    <Grid3X3 size={16} /> {showLibrary ? 'Hide Library' : 'Choose from Library'}
                  </button>
                </div>
                {showLibrary && (
                  <div className="mt-4 border-2 border-[#1A1A1A] hand-drawn-border-alt p-3 max-h-48 overflow-y-auto">
                    {imageLibrary.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">No images in library yet.</p>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {imageLibrary.map((img) => (
                          <button key={img.id} type="button" onClick={() => { setCurrentTopic({ ...currentTopic, image_url: img.url }); setShowLibrary(false); }}
                            className={`relative aspect-square rounded border-2 overflow-hidden transition-all hover:opacity-80 ${currentTopic.image_url === img.url ? 'border-[#DC2626] ring-2 ring-[#DC2626]/30' : 'border-gray-200 hover:border-[#1A1A1A]'}`}>
                            <img src={`${API_BASE}${img.url}`} alt={img.original_name} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <HandDrawnButton variant="outline" onClick={handleCloseModal}>Cancel</HandDrawnButton>
              <HandDrawnButton variant="primary" onClick={handleSave} disabled={!currentTopic.title || saving}>{saving ? 'Saving…' : 'Save Topic'}</HandDrawnButton>
            </div>
          </HandDrawnCard>
        </div>
      )}
    </div>
  );
}
export default AdminTopicsPage;
