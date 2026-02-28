import React, { useState } from 'react';
import { Plus, Edit2, Trash2, MessageSquare } from 'lucide-react';
import { HandDrawnButton } from '../../components/HandDrawnButton';
import { HandDrawnCard } from '../../components/HandDrawnCard';
import { HandDrawnInput } from '../../components/HandDrawnInput';
import { SquigglyLine } from '../../components/DoodleDecorations';
interface Topic {
  id: string;
  language_id: string;
  title: string;
  description: string;
  conversation_prompt: string;
}
const initialTopics: Topic[] = [
{
  id: '1',
  language_id: 'All',
  title: 'Travel',
  description: 'Airports, hotels, and sightseeing.',
  conversation_prompt: 'Act as a travel agent or local guide...'
},
{
  id: '2',
  language_id: 'All',
  title: 'Food & Cooking',
  description: 'Ordering at restaurants and recipes.',
  conversation_prompt: 'Act as a waiter or chef...'
},
{
  id: '3',
  language_id: 'Spanish',
  title: 'Tapas Culture',
  description: 'Discussing Spanish tapas.',
  conversation_prompt: 'Act as a local in a tapas bar...'
}];

export function AdminTopicsPage() {
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<Partial<Topic>>({});
  const handleOpenModal = (topic?: Topic) => {
    if (topic) {
      setCurrentTopic(topic);
    } else {
      setCurrentTopic({
        language_id: 'All'
      });
    }
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentTopic({});
  };
  const handleSave = () => {
    if (currentTopic.id) {
      setTopics(
        topics.map((t) =>
        t.id === currentTopic.id ?
        {
          ...t,
          ...currentTopic
        } as Topic :
        t
        )
      );
    } else {
      const newTopic: Topic = {
        ...currentTopic,
        id: Math.random().toString(36).substr(2, 9)
      } as Topic;
      setTopics([...topics, newTopic]);
    }
    handleCloseModal();
  };
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this topic?')) {
      setTopics(topics.filter((t) => t.id !== id));
    }
  };
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="relative inline-block">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A1A]">
            Topic Management
          </h1>
          <SquigglyLine className="absolute -bottom-2 left-0 w-full h-2 text-[#F59E0B]" />
        </div>
        <HandDrawnButton
          variant="primary"
          onClick={() => handleOpenModal()}
          className="shrink-0">

          <Plus size={18} /> Add Topic
        </HandDrawnButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topics.map((topic, idx) =>
        <HandDrawnCard
          key={topic.id}
          rotate={idx % 2 === 0 ? 'left' : 'right'}
          className="flex flex-col">

            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-[#F59E0B]" />
                <h3 className="font-heading text-xl font-bold">
                  {topic.title}
                </h3>
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-gray-100 border-2 border-[#1A1A1A] hand-drawn-border-pill">
                {topic.language_id}
              </span>
            </div>

            <p className="text-gray-600 text-sm mb-4 flex-1">
              {topic.description}
            </p>

            <div className="bg-gray-50 p-3 border-2 border-dashed border-gray-300 hand-drawn-border-alt mb-4">
              <p className="text-xs font-mono text-gray-500 line-clamp-2">
                {topic.conversation_prompt}
              </p>
            </div>

            <div className="flex justify-end gap-2 mt-auto pt-4 border-t-2 border-dashed border-gray-200">
              <HandDrawnButton
              variant="outline"
              onClick={() => handleOpenModal(topic)}
              className="px-3 py-1.5 text-sm">

                <Edit2 size={14} /> Edit
              </HandDrawnButton>
              <HandDrawnButton
              variant="outline"
              onClick={() => handleDelete(topic.id)}
              className="px-3 py-1.5 text-sm text-[#DC2626] hover:bg-red-50 border-transparent hover:border-[#DC2626]">

                <Trash2 size={14} /> Delete
              </HandDrawnButton>
            </div>
          </HandDrawnCard>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen &&
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <HandDrawnCard className="w-full max-w-lg bg-white" rotate="none">
            <h2 className="font-heading text-2xl font-bold mb-6">
              {currentTopic.id ? 'Edit Topic' : 'Create New Topic'}
            </h2>

            <div className="space-y-4">
              <HandDrawnInput
              label="Topic Title"
              value={currentTopic.title || ''}
              onChange={(e) =>
              setCurrentTopic({
                ...currentTopic,
                title: e.target.value
              })
              }
              placeholder="e.g., Travel" />


              <div className="flex flex-col gap-2">
                <label className="font-heading font-bold text-[#1A1A1A] text-lg">
                  Language Restriction
                </label>
                <select
                className="w-full bg-transparent border-2 border-[#1A1A1A] hand-drawn-border-alt px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                value={currentTopic.language_id || 'All'}
                onChange={(e) =>
                setCurrentTopic({
                  ...currentTopic,
                  language_id: e.target.value
                })
                }>

                  <option>All Languages</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>Japanese</option>
                </select>
              </div>

              <HandDrawnInput
              label="Description"
              multiline
              rows={2}
              value={currentTopic.description || ''}
              onChange={(e) =>
              setCurrentTopic({
                ...currentTopic,
                description: e.target.value
              })
              }
              placeholder="Brief description visible to users..." />


              <HandDrawnInput
              label="Conversation Prompt (System)"
              multiline
              rows={4}
              value={currentTopic.conversation_prompt || ''}
              onChange={(e) =>
              setCurrentTopic({
                ...currentTopic,
                conversation_prompt: e.target.value
              })
              }
              placeholder="Instructions for the AI..."
              className="font-mono text-sm" />

            </div>

            <div className="flex justify-end gap-3 mt-8">
              <HandDrawnButton variant="outline" onClick={handleCloseModal}>
                Cancel
              </HandDrawnButton>
              <HandDrawnButton
              variant="primary"
              onClick={handleSave}
              disabled={!currentTopic.title}>

                Save Topic
              </HandDrawnButton>
            </div>
          </HandDrawnCard>
        </div>
      }
    </div>);

}