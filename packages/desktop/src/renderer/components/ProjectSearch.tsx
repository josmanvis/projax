import React, { useState, useRef, useEffect } from 'react';
import './ProjectSearch.css';

export type FilterType = 'all' | 'name' | 'path' | 'ports' | 'running';
export type SortType = 'name-asc' | 'name-desc' | 'recent' | 'oldest' | 'running';

interface ProjectSearchProps {
  onSearchChange: (query: string, filterType: FilterType) => void;
  onSortChange?: (sortType: SortType) => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

const ProjectSearch: React.FC<ProjectSearchProps> = ({ onSearchChange, onSortChange, searchInputRef }) => {
  const [query, setQuery] = useState('');
  const [_filterType, _setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('name-asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef || internalInputRef;

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onSearchChange(newQuery, 'all');
  };

  const handleSortChange = (newSort: SortType) => {
    setSortType(newSort);
    setShowSortMenu(false);
    if (onSortChange) {
      onSortChange(newSort);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };

    if (showSortMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSortMenu]);

  const sortOptions: { value: SortType; label: string }[] = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'recent', label: 'Recently Scanned' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'running', label: 'Running First' },
  ];

  return (
    <div className="project-search">
      <div className="search-input-group" ref={menuRef}>
        <div className="search-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search projects... (⌘/)"
            value={query}
            onChange={handleQueryChange}
            className="search-input"
          />
          <button
            className="sort-icon-btn"
            onClick={() => setShowSortMenu(!showSortMenu)}
            title="Sort options"
            tabIndex={0}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 4h10M3 8h7M3 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        {showSortMenu && (
          <div className="sort-menu">
            {sortOptions.map((option) => (
              <div
                key={option.value}
                className={`sort-menu-item ${sortType === option.value ? 'active' : ''}`}
                onClick={() => handleSortChange(option.value)}
              >
                {option.label}
                {sortType === option.value && <span className="checkmark">✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSearch;
