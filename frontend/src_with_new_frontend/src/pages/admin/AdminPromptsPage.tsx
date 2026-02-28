import React, { useState } from 'react';
import { Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { HandDrawnButton } from '../../components/HandDrawnButton';
import { HandDrawnCard } from '../../components/HandDrawnCard';
import { HandDrawnInput } from '../../components/HandDrawnInput';
import { SquigglyLine } from '../../components/DoodleDecorations';
interface Prompt {
  id: string;
  type: string;
  name: string;
  content: string;
  isActive: boolean;
}
const initialPrompts: Prompt[] = [
{
  id: '1',
  type: 'Global',
  name: 'Base Persona',
  content: 'You are a friendly, encouraging language coach...',
  isActive: true
},
{
  id: '2',
  type: 'Global',
  name: 'Strict Persona',
  content: 'You are a strict grammar teacher...',
  isActive: false
},
{
  id: '3',
  type: 'Freestyle',
  name: 'Default Freestyle',
  content: 'Engage the user in open conversation...',
  isActive: true
},
{
  id: '4',
  type: 'Assessment',
  name: 'Level Test',
  content: "Evaluate the user's CEFR level based on...",
  isActive: true
}];

export function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<Partial<Prompt>>({});
  const handleOpenModal = (prompt?: Prompt) => {
    if (prompt) {
      setCurrentPrompt(prompt);
    } else {
      setCurrentPrompt({
        type: 'Global',
        isActive: false
      });
    }
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPrompt({});
  };
  const handleSave = () => {
    if (currentPrompt.id) {
      // If setting active, deactivate others of same type
      let updatedPrompts = [...prompts];
      if (currentPrompt.isActive) {
        updatedPrompts = updatedPrompts.map((p) =>
        p.type === currentPrompt.type ?
        {
          ...p,
          isActive: false
        } :
        p
        );
      }
      setPrompts(
        updatedPrompts.map((p) =>
        p.id === currentPrompt.id ?
        {
          ...p,
          ...currentPrompt
        } as Prompt :
        p
        )
      );
    } else {
      let updatedPrompts = [...prompts];
      if (currentPrompt.isActive) {
        updatedPrompts = updatedPrompts.map((p) =>
        p.type === currentPrompt.type ?
        {
          ...p,
          isActive: false
        } :
        p
        );
      }
      const newPrompt: Prompt = {
        ...currentPrompt,
        id: Math.random().toString(36).substr(2, 9)
      } as Prompt;
      setPrompts([...updatedPrompts, newPrompt]);
    }
    handleCloseModal();
  };
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      setPrompts(prompts.filter((p) => p.id !== id));
    }
  };
  const toggleActive = (id: string, type: string) => {
    setPrompts(
      prompts.map((p) => {
        if (p.id === id)
        return {
          ...p,
          isActive: true
        };
        if (p.type === type)
        return {
          ...p,
          isActive: false
        };
        return p;
      })
    );
  };
  // Group prompts by type
  const groupedPrompts = prompts.reduce(
    (acc, prompt) => {
      if (!acc[prompt.type]) acc[prompt.type] = [];
      acc[prompt.type].push(prompt);
      return acc;
    },
    {} as Record<string, Prompt[]>
  );
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="relative inline-block">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A1A]">
            System Prompts
          </h1>
          <SquigglyLine className="absolute -bottom-2 left-0 w-full h-2 text-[#1A1A1A]" />
        </div>
        <HandDrawnButton
          variant="primary"
          onClick={() => handleOpenModal()}
          className="shrink-0">

          <Plus size={18} /> Add Prompt
        </HandDrawnButton>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedPrompts).map(([type, typePrompts]) =>
        <div
          key={type}
          className="bg-white border-2 border-[#1A1A1A] hand-drawn-border-alt hand-drawn-shadow overflow-hidden">

            <div className="bg-[#FAFAF8] p-4 border-b-2 border-[#1A1A1A] flex items-center gap-2">
              <FileText size={20} />
              <h2 className="font-heading font-bold text-xl">{type} Prompts</h2>
            </div>
            <div className="p-4 space-y-4">
              {typePrompts.map((prompt) =>
            <div
              key={prompt.id}
              className={`p-4 border-2 border-[#1A1A1A] hand-drawn-border ${prompt.isActive ? 'bg-[#10B981]/10 border-[#10B981]' : 'bg-white'}`}>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg">{prompt.name}</h3>
                      {prompt.isActive &&
                  <span className="text-xs font-bold px-2 py-1 bg-[#10B981] text-white hand-drawn-border-pill border-2 border-[#1A1A1A]">
                          ACTIVE
                        </span>
                  }
                    </div>
                    <div className="flex items-center gap-2">
                      {!prompt.isActive &&
                  <button
                    onClick={() => toggleActive(prompt.id, prompt.type)}
                    className="text-sm font-bold px-3 py-1 border-2 border-[#1A1A1A] hand-drawn-border-pill hover:bg-gray-100 transition-colors">

                          Set Active
                        </button>
                  }
                      <button
                    onClick={() => handleOpenModal(prompt)}
                    className="p-1.5 hover:bg-gray-200 rounded-full transition-colors border-2 border-transparent hover:border-[#1A1A1A] hand-drawn-border">

                        <Edit2 size={16} />
                      </button>
                      <button
                    onClick={() => handleDelete(prompt.id)}
                    className="p-1.5 hover:bg-red-100 text-[#DC2626] rounded-full transition-colors border-2 border-transparent hover:border-[#DC2626] hand-drawn-border">

                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-mono text-gray-600 bg-gray-50 p-3 border-2 border-dashed border-gray-200 hand-drawn-border-alt">
                    {prompt.content}
                  </p>
                </div>
            )}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen &&
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <HandDrawnCard className="w-full max-w-2xl bg-white" rotate="none">
            <h2 className="font-heading text-2xl font-bold mb-6">
              {currentPrompt.id ? 'Edit Prompt' : 'Create New Prompt'}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <HandDrawnInput
                label="Prompt Name"
                value={currentPrompt.name || ''}
                onChange={(e) =>
                setCurrentPrompt({
                  ...currentPrompt,
                  name: e.target.value
                })
                }
                placeholder="e.g., Base Persona" />


                <div className="flex flex-col gap-2">
                  <label className="font-heading font-bold text-[#1A1A1A] text-lg">
                    Type
                  </label>
                  <select
                  className="w-full bg-transparent border-2 border-[#1A1A1A] hand-drawn-border-alt px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                  value={currentPrompt.type || 'Global'}
                  onChange={(e) =>
                  setCurrentPrompt({
                    ...currentPrompt,
                    type: e.target.value
                  })
                  }>

                    <option>Global</option>
                    <option>Freestyle</option>
                    <option>Assessment</option>
                    <option>Correction</option>
                  </select>
                </div>
              </div>

              <HandDrawnInput
              label="Prompt Content"
              multiline
              rows={8}
              value={currentPrompt.content || ''}
              onChange={(e) =>
              setCurrentPrompt({
                ...currentPrompt,
                content: e.target.value
              })
              }
              placeholder="System instructions..."
              className="font-mono text-sm" />


              <div className="flex items-center gap-3 pt-2">
                <input
                type="checkbox"
                id="active-toggle"
                className="w-5 h-5 border-2 border-[#1A1A1A] rounded-sm accent-[#1A1A1A]"
                checked={currentPrompt.isActive || false}
                onChange={(e) =>
                setCurrentPrompt({
                  ...currentPrompt,
                  isActive: e.target.checked
                })
                } />

                <label
                htmlFor="active-toggle"
                className="font-bold cursor-pointer">

                  Set as Active (will deactivate others of this type)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <HandDrawnButton variant="outline" onClick={handleCloseModal}>
                Cancel
              </HandDrawnButton>
              <HandDrawnButton
              variant="primary"
              onClick={handleSave}
              disabled={!currentPrompt.name || !currentPrompt.content}>

                Save Prompt
              </HandDrawnButton>
            </div>
          </HandDrawnCard>
        </div>
      }
    </div>);

}