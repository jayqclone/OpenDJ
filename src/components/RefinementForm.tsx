import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface RefinementFormProps {
  onSubmit: (refinementPrompt: string) => Promise<void>;
  isLoading: boolean;
}

const RefinementForm: React.FC<RefinementFormProps> = ({ onSubmit, isLoading }) => {
  const [refinementPrompt, setRefinementPrompt] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (refinementPrompt.trim() === '') return;
    
    await onSubmit(refinementPrompt.trim());
    setRefinementPrompt('');
  };
  
  return (
    <div className="bg-dark-300 rounded-lg p-4 md:p-6">
      <h3 className="text-xl font-semibold mb-3">Refine Your Playlist</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="refinement" className="block mb-2 text-sm text-light-200">
            Not quite right? Describe how you'd like to refine this playlist.
          </label>
          <textarea
            id="refinement"
            value={refinementPrompt}
            onChange={(e) => setRefinementPrompt(e.target.value)}
            placeholder="e.g., 'Add more upbeat songs' or 'Remove anything too experimental'"
            className="input-field min-h-[80px]"
            disabled={isLoading}
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary flex items-center gap-2"
            disabled={isLoading || refinementPrompt.trim() === ''}
          >
            {isLoading ? (
              <>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                Refining
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Refine Playlist
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RefinementForm;