'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock, Trash2 } from 'lucide-react';
import { searchService, type SearchResult } from '@/lib/services/searchService';

const SearchDropdown: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load recent searches
  useEffect(() => {
    setRecentSearches(searchService.getRecentSearches());
  }, []);

  // Debounced search
  const handleSearch = useCallback(
    async (searchQuery: string) => {
      setQuery(searchQuery);
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await searchService.globalSearch(searchQuery);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Debounce with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const handleSelectResult = (result: SearchResult) => {
    searchService.saveRecentSearch(result.title);
    router.push(result.href);
    setQuery('');
    setIsOpen(false);
  };

  const handleRecentClick = (recentQuery: string) => {
    setQuery(recentQuery);
    setIsOpen(true);
  };

  const handleClearRecent = () => {
    searchService.clearRecentSearches();
    setRecentSearches([]);
  };

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Ara... (Öğrenci, İşlem, Rapor)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (query.length > 0 || recentSearches.length > 0) && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Results */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
            {/* Loading */}
            {isLoading && (
              <div className="p-4 text-center text-gray-500">
                <div className="inline-block animate-spin">⏳</div> Aranıyor...
              </div>
            )}

            {/* Results */}
            {!isLoading && results.length > 0 && (
              <div className="p-2">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelectResult(result)}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition flex items-start gap-3"
                  >
                    <span className="text-lg mt-0.5">{result.icon || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {result.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {result.subtitle}
                      </p>
                      {result.metadata && (
                        <div className="text-xs text-gray-400 mt-1">
                          {Object.values(result.metadata).join(' • ')}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {!isLoading && query.length > 0 && results.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                <p>Sonuç bulunamadı</p>
                <p className="text-xs mt-1">Farklı bir arama terimi deneyin</p>
              </div>
            )}

            {/* Recent Searches */}
            {query.length === 0 && recentSearches.length > 0 && (
              <div className="p-2 border-t border-gray-200">
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                    <Clock size={14} />
                    Son Aramalar
                  </div>
                  <button
                    onClick={handleClearRecent}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {recentSearches.map((recent, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRecentClick(recent)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm text-gray-600 transition"
                  >
                    {recent}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchDropdown;
