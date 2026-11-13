import React from 'react';
import { BookmarkPlus, ThumbsUp, ThumbsDown, MessageSquare, Quote } from 'lucide-react';
import { Paper } from '../types';

interface PaperCardProps {
  paper: Paper;
  isSelected: boolean;
  onSelect: () => void;
}

export function PaperCard({ paper, isSelected, onSelect }: PaperCardProps) {
  return (
    <article
      onClick={onSelect}
      className={`bg-white border rounded-lg p-3.5 hover:shadow-md transition-all cursor-pointer ${
        isSelected ? 'border-gray-900 shadow-md' : 'border-gray-200'
      }`}
    >
      {/* Title */}
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1.5">
            <h3 className="flex-1 text-sm font-semibold text-blue-600 leading-snug hover:underline cursor-pointer">
              {paper.title}
            </h3>
          </div>

          {/* Authors */}
          <div className="text-xs text-gray-600 mb-2 line-clamp-1">
            {paper.authors.slice(0, 3).join(', ')} - {paper.year} - {paper.venue}
          </div>

          {/* Abstract */}
          <p className="text-xs text-gray-700 leading-relaxed mb-2.5 line-clamp-2">
            {paper.abstract}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                <BookmarkPlus className="w-3.5 h-3.5" />
                Add to Library
              </button>
              <button className="text-gray-500 hover:text-blue-600 transition-colors">
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 font-medium transition-colors">
                <ThumbsDown className="w-3.5 h-3.5" />
                Dislike
              </button>
              <button className="text-gray-500 hover:text-blue-600 transition-colors">
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
              {/* Only show Cite and Cited By for non-book and non-special resources */}
              {paper.type !== 'book' && paper.type !== 'special' && (
                <>
                  <button className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    <Quote className="w-3.5 h-3.5" />
                    Cite
                  </button>
                  <span className="text-xs text-gray-600">Cited By: {paper.citations}</span>
                </>
              )}
            </div>
            
            
          </div>
        </div>
      </div>
    </article>
  );
}
