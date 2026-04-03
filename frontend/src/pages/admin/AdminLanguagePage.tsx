import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Edit2, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { HandDrawnButton } from '../../components/HandDrawnButton';
import { HandDrawnCard } from '../../components/HandDrawnCard';
import { HandDrawnInput } from '../../components/HandDrawnInput';
import { SquigglyLine } from '../../components/DoodleDecorations';
import { API_BASE } from '../../config/endpoints';

interface Language {
  id: string;
  name: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export function AdminLanguagePage() {
  const { languageId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${user?.token}`,
    'Content-Type': 'application/json',
  };

  const [language, setLanguage] = useState<Language | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Language>>({});
  const [saving, setSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadLanguage = useCallback(async () => {
    if (!languageId) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/languages/${languageId}`, { headers });
      if (res.ok) {
        const data: Language = await res.json();
        setLanguage(data);
        setEditData({ name: data.name, enabled: data.enabled });
      } else {
        setError('Language not found');
      }
    } catch (err) {
      setError('Failed to load language');
      console.error('Failed to load language', err);
    } finally {
      setLoading(false);
    }
  }, [languageId, user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadLanguage();
  }, [loadLanguage]);

  const handleEdit = () => {
    if (language) {
      setEditData({ name: language.name, enabled: language.enabled });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (language) {
      setEditData({ name: language.name, enabled: language.enabled });
    }
  };

  const handleSave = async () => {
    if (!languageId || !editData.name) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/languages/${languageId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: editData.name,
          enabled: editData.enabled,
        }),
      });
      if (res.ok) {
        const updatedLanguage: Language = await res.json();
        setLanguage(updatedLanguage);
        setIsEditing(false);
      } else {
        setError('Failed to save language');
      }
    } catch (err) {
      setError('Failed to save language');
      console.error('Failed to save language', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!languageId) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/languages/${languageId}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        navigate('/admin');
      } else {
        setError('Failed to delete language');
      }
    } catch (err) {
      setError('Failed to delete language');
      console.error('Failed to delete language', err);
    } finally {
      setDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <HandDrawnCard className="max-w-md mx-auto p-6">
          <h2 className="font-heading text-2xl font-bold text-[#DC2626] mb-4">
            Error
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <HandDrawnButton variant="primary" onClick={() => navigate('/admin')}>
            <ArrowLeft size={16} /> Back to Admin
          </HandDrawnButton>
        </HandDrawnCard>
      </div>
    );
  }

  if (!language) {
    return (
      <div className="text-center py-20">
        <HandDrawnCard className="max-w-md mx-auto p-6">
          <h2 className="font-heading text-2xl font-bold text-[#DC2626] mb-4">
            Language Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The requested language does not exist.
          </p>
          <HandDrawnButton variant="primary" onClick={() => navigate('/admin')}>
            <ArrowLeft size={16} /> Back to Admin
          </HandDrawnButton>
        </HandDrawnCard>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-gray-500 mb-6 font-medium">
        <Link to="/admin" className="hover:text-[#1A1A1A] transition-colors">
          Admin
        </Link>
        <span>{'>'}</span>
        <span className="text-[#1A1A1A]">Edit Language</span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="relative inline-block">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A1A]">
            {isEditing ? 'Edit Language' : language.name}
          </h1>
          <SquigglyLine className="absolute -bottom-2 left-0 w-full h-2 text-[#DC2626]" />
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <HandDrawnButton variant="outline" onClick={handleEdit} className="px-3 py-2">
                <Edit2 size={16} /> Edit
              </HandDrawnButton>
              <HandDrawnButton
                variant="outline"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-3 py-2 text-[#DC2626] hover:bg-red-50 border-transparent hover:border-[#DC2626]"
              >
                <Trash2 size={16} /> Delete
              </HandDrawnButton>
            </>
          ) : (
            <>
              <HandDrawnButton variant="outline" onClick={handleCancelEdit} className="px-3 py-2">
                Cancel
              </HandDrawnButton>
              <HandDrawnButton
                variant="primary"
                onClick={handleSave}
                disabled={!editData.name || saving}
                className="px-3 py-2"
              >
                {saving ? 'Saving…' : 'Save'}
              </HandDrawnButton>
            </>
          )}
        </div>
      </div>

      <HandDrawnCard rotate="none" className="p-6">
        {isEditing ? (
          <div className="space-y-6">
            <HandDrawnInput
              label="Language ID"
              value={language.id}
              disabled
              className="font-mono"
            />
            <HandDrawnInput
              label="Language Name"
              value={editData.name || ''}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              placeholder="e.g., Spanish"
            />
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={editData.enabled !== false}
                onChange={(e) => setEditData({ ...editData, enabled: e.target.checked })}
              />
              Enabled
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Language ID</p>
              <p className="font-mono text-lg">{language.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Name</p>
              <p className="text-xl font-bold">{language.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
              <p className={language.enabled ? 'text-green-600' : 'text-gray-500'}>
                {language.enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            {language.created_at && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Created</p>
                <p className="text-sm text-gray-600">
                  {new Date(language.created_at).toLocaleString()}
                </p>
              </div>
            )}
            {language.updated_at && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Last Updated</p>
                <p className="text-sm text-gray-600">
                  {new Date(language.updated_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}
      </HandDrawnCard>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <HandDrawnCard className="w-full max-w-sm bg-white border-[#DC2626]" rotate="left">
            <h2 className="font-heading text-2xl font-bold mb-4 text-[#DC2626]">
              Delete Language?
            </h2>
            <p className="text-gray-600 mb-8">
              This will permanently delete the language and all its associated courses, lessons, and topics. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <HandDrawnButton variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </HandDrawnButton>
              <HandDrawnButton
                variant="primary"
                className="bg-[#DC2626] hover:bg-red-800"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </HandDrawnButton>
            </div>
          </HandDrawnCard>
        </div>
      )}
    </div>
  );
}

export default AdminLanguagePage;
