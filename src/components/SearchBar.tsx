import React from 'react';
import { Search } from 'lucide-react';
import { SearchFilters } from '../types';
import { countries, sortOptions } from '../utils/countries';

interface SearchBarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ filters, onFiltersChange, onSearch, isLoading }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="lg:col-span-2">
          <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">
            키워드
          </label>
          <input
            id="keyword"
            type="text"
            value={filters.keyword}
            onChange={(e) => onFiltersChange({ ...filters, keyword: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
            placeholder="검색할 키워드를 입력하세요"
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            국가
          </label>
          <select
            id="country"
            value={filters.country}
            onChange={(e) => onFiltersChange({ ...filters, country: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
            정렬
          </label>
          <select
            id="sortBy"
            value={filters.sortBy}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                sortBy: e.target.value as SearchFilters['sortBy'],
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading || !filters.keyword.trim()}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md flex items-center justify-center gap-2"
        >
          <Search className="w-5 h-5" />
          {isLoading ? '검색 중...' : '검색'}
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
