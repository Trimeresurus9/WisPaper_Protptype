import React, { useState } from 'react';
import { ExternalLink, BookmarkPlus, ThumbsUp, ThumbsDown, MessageSquare, MoreHorizontal, Quote } from 'lucide-react';
import { Paper } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface PaperCardProps {
  paper: Paper;
  isSelected: boolean;
  onSelect: () => void;
}

export function PaperCard({ paper, isSelected, onSelect }: PaperCardProps) {
  const { t } = useLanguage();
  
  // 获取资源类型标签
  const getResourceTypeLabel = (type?: string) => {
    switch (type) {
      case 'book':
        return t('resource.book');
      case 'thesis':
        return t('resource.thesis');
      case 'special':
        return t('resource.special');
      case 'dataset':
        return t('resource.dataset');
      case 'paper':
      default:
        return t('resource.paper');
    }
  };
  
  // 获取资源类型标签样式
  const getResourceTypeStyle = (type?: string) => {
    const baseStyle = "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium";
    switch (type) {
      case 'book':
        return `${baseStyle} bg-gray-100 text-gray-700 border border-gray-300`;
      case 'thesis':
        return `${baseStyle} bg-gray-100 text-gray-700 border border-gray-300`;
      case 'special':
        return `${baseStyle} bg-gray-100 text-gray-700 border border-gray-300`;
      case 'dataset':
        return `${baseStyle} bg-gray-100 text-gray-700 border border-gray-300`;
      case 'paper':
      default:
        return `${baseStyle} bg-gray-100 text-gray-700 border border-gray-300`;
    }
  };

  return (
    <article
      onClick={onSelect}
      className={`bg-white border rounded-lg p-3.5 hover:shadow-md transition-all cursor-pointer ${
        isSelected ? 'border-gray-900 shadow-md' : 'border-gray-200'
      }`}
    >
      {/* Title and Badge */}
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1.5">
            {/* Resource Type Tag */}
            <span className={getResourceTypeStyle(paper.type)}>
              {getResourceTypeLabel(paper.type)}
            </span>
            
            <h3 className="flex-1 text-sm font-semibold text-blue-600 leading-snug hover:underline cursor-pointer">
              <button type="button" className="text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500" onClick={event => { event.stopPropagation(); onSelect(); }}>{paper.title}</button>
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <span className="text-blue-600 text-xs font-medium">Perfect</span>
            </div>
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
              <a href="#" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
                馆藏链接
              </a>
            </div>
            
            
          </div>
        </div>
      </div>
    </article>
  );
}
