import React, { useState } from 'react';
import { X, Image, Link2, Code, FileText, Award, HelpCircle } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Dialog } from '../../../components/common/Dialog';
import type { PostType } from '../types';

interface CreatePostFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (postData: { title: string; content: string; type: PostType; tags: string[]; isExpertPost: boolean }) => Promise<void>;
  isSubmitting: boolean;
}
const POST_TYPES = [
  { value: 'question', label: 'Ask a Question', icon: HelpCircle },
  { value: 'guide', label: 'Share a Guide', icon: FileText },
  { value: 'success_story', label: 'Share Success Story', icon: Award },
];
export const CreatePostForm: React.FC<CreatePostFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState<PostType>('question');
  const [isExpertPost, setIsExpertPost] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    await onSubmit({
      title: title.trim(),
      content: content.trim(),
      type: selectedType,
      tags,
      isExpertPost,
    });
    
    // Reset form on success
    setTitle('');
    setContent('');
    setTags([]);
    setIsExpertPost(false);
    onClose();
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() && !tags.includes(tagInput.trim())) {
      e.preventDefault();
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Create Post">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mode Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Post as</label>
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsExpertPost(false)}
              className={`px-4 py-2 text-sm font-medium transition ${
                !isExpertPost ? 'bg-teal-500 text-white' : 'bg-white text-gray-700'
              }`}
            >
              Contributor
            </button>
            <button
              type="button"
              onClick={() => setIsExpertPost(true)}
              className={`px-4 py-2 text-sm font-medium transition ${
                isExpertPost ? 'bg-sky-500 text-white' : 'bg-white text-gray-700'
              }`}
            >
              Expert
            </button>
          </div>
        </div>

        {/* Post Type Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Post Type</label>
          <div className="grid grid-cols-3 gap-2">
            {POST_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value as PostType)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-colors ${
                    selectedType === type.value
                      ? 'border-teal-400 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-200/80'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-sm">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-400 focus:border-teal-400"
            placeholder="What's your post about?"
            required
          />
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Details
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-400 focus:border-teal-400"
            placeholder={`${
              selectedType === 'question' 
                ? 'Provide more details about your question...' 
                : 'Write your post here...'
            }`}
            required
          />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span 
                key={tag} 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-teal-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-teal-200/80 text-teal-700 hover:bg-teal-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            id="tags"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={addTag}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-400 focus:border-teal-400"
            placeholder="Add tags (press Enter to add)"
          />
        </div>

        {/* Formatting Toolbar */}
        <div className="flex items-center justify-between border-t border-b border-gray-200 py-2">
          <div className="flex space-x-1">
            <button
              type="button"
              className="p-2 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800"
              title="Add image"
            >
              <Image className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800"
              title="Add link"
            >
              <Link2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800"
              title="Add code"
            >
              <Code className="w-5 h-5" />
            </button>
          </div>
          <div className="text-xs text-gray-500">
            Markdown is supported
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            disabled={!title.trim() || !content.trim() || isSubmitting}
            data-loading={isSubmitting ? 'true' : undefined}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
