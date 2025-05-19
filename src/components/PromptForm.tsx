import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { PromptFormValues } from '../types';

interface PromptFormProps {
  onSubmit: (values: PromptFormValues) => void;
  isLoading: boolean;
}

const EXAMPLE_PROMPTS = [
  "Upbeat 80s pop songs with female vocalists",
  "Relaxing jazz for a rainy Sunday morning",
  "High-energy workout mix with modern hip-hop",
  "Indie folk songs perfect for a road trip"
];

const PromptForm: React.FC<PromptFormProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState<'spotify' | 'apple'>('spotify');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (prompt.trim() === '') return;
    
    onSubmit({
      prompt: prompt.trim(),
      platform
    });
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          AI Playlist Generator
        </h1>
        <p className="text-light-200 text-md md:text-lg">
          Describe your perfect playlist and we'll create it for you
        </p>
      </div>
      
      <div className="flex justify-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => setPlatform('spotify')}
          className={clsx(
            'flex items-center gap-2 px-6 py-3 rounded-full transition-all',
            platform === 'spotify' 
              ? 'bg-spotify text-black font-medium' 
              : 'border border-light-100 text-light-100'
          )}
          disabled={isLoading}
        >
          Spotify
        </button>
        
        <button
          type="button"
          onClick={() => setPlatform('apple')}
          className={clsx(
            'flex items-center gap-2 px-6 py-3 rounded-full transition-all',
            platform === 'apple' 
              ? 'bg-apple text-light-100 font-medium' 
              : 'border border-light-100 text-light-100'
          )}
          disabled={isLoading}
        >
          Apple Music
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="prompt" className="block mb-2 text-lg font-medium text-center">
            What kind of playlist do you want?
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'Upbeat 80s pop songs with female vocalists' or 'Relaxing jazz for a rainy Sunday morning'"
            className="input-field min-h-[120px]"
            disabled={isLoading}
          />
        </div>
        
        <div className="flex justify-center">
          <button
            type="submit"
            className="btn btn-primary w-full max-w-md flex items-center justify-center gap-2"
            disabled={isLoading || prompt.trim() === ''}
          >
            {isLoading ? (
              <>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                Generating
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Playlist
              </>
            )}
          </button>
        </div>

        <div className="mt-8">
          <p className="text-center text-light-200 mb-4">Need inspiration? Try one of these:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EXAMPLE_PROMPTS.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="text-left p-3 rounded-lg border border-light-100 hover:bg-light-100 hover:bg-opacity-10 transition-colors text-sm"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};

export default PromptForm;