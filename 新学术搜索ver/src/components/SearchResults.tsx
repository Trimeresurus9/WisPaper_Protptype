import { PaperList } from './PaperList';
import { Paper } from '../types';

interface SearchResultsProps {
  papers: Paper[];
  books: any[];
  theses: any[];
  selectedPaper: Paper | null;
  onSelectPaper: (paper: Paper) => void;
  searchQuery: string;
}

export function SearchResults({ 
  papers, 
  selectedPaper, 
  onSelectPaper,
}: SearchResultsProps) {
  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <PaperList
          papers={papers}
          selectedPaper={selectedPaper}
          onSelectPaper={onSelectPaper}
        />
      </div>
    </div>
  );
}
