import { searchNotes, switchToNote, type SearchResult } from '../../core';
import { icons } from './icons';

let searchInput: HTMLInputElement | null = null;
let searchResults: SearchResult[] = [];

export function renderSearchPanel(): string {
  return `
    <div class="search-panel">
      <div class="search-panel__header">
        <div class="search-panel__input-wrapper">
          <div class="search-panel__input-icon">
            ${icons.search}
          </div>
          <input
            type="text"
            class="search-panel__input"
            placeholder="Search notes..."
            id="search-input"
            autocomplete="off"
          />
        </div>
      </div>
      <div class="search-panel__results" id="search-results">
        <div class="search-panel__empty">
          <p>Search across all your notes</p>
        </div>
      </div>
    </div>
  `;
}

function highlightMatch(text: string, query: string): string {
  if (!query) return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function renderSearchResults(results: SearchResult[], query: string): string {
  if (results.length === 0) {
    return `
      <div class="search-panel__empty">
        <p>No results found for "${query}"</p>
      </div>
    `;
  }

  const resultsHTML = results.map(result => {
    const matchesHTML = result.matches.map(match => {
      const highlighted = highlightMatch(match.text, query);
      return `
        <div class="search-result__match">
          ${match.lineNumber > 0 ? `<span class="search-result__line">Line ${match.lineNumber}</span>` : ''}
          <div class="search-result__text">${highlighted}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="search-result" data-note-path="${result.notePath}">
        <div class="search-result__title">${highlightMatch(result.noteTitle, query)}</div>
        <div class="search-result__matches">
          ${matchesHTML}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="search-panel__results-header">
      <span>${results.length} result${results.length !== 1 ? 's' : ''}</span>
    </div>
    ${resultsHTML}
  `;
}

function performSearch(query: string): void {
  const resultsContainer = document.getElementById('search-results');

  if (!resultsContainer) {
    return;
  }

  if (query.trim().length === 0) {
    resultsContainer.innerHTML = `
      <div class="search-panel__empty">
        <p>Search across all your notes</p>
      </div>
    `;
    searchResults = [];
    return;
  }

  searchResults = searchNotes(query);
  resultsContainer.innerHTML = renderSearchResults(searchResults, query);
}

let debounceTimer: number | null = null;

function handleSearchInput(e: Event): void {
  const input = e.target as HTMLInputElement;
  const query = input.value;

  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = window.setTimeout(() => {
    performSearch(query);
  }, 150);
}

function handleResultClick(e: MouseEvent): void {
  const target = e.target as HTMLElement;
  const resultElement = target.closest('.search-result');

  if (resultElement) {
    const notePath = resultElement.getAttribute('data-note-path');
    if (notePath) {
      switchToNote(notePath);
      if (searchInput) {
        searchInput.value = '';
        performSearch('');
      }
    }
  }
}

export function initSearchPanel(): void {
  searchInput = document.getElementById('search-input') as HTMLInputElement;
  const resultsContainer = document.getElementById('search-results');

  if (searchInput) {
    searchInput.addEventListener('input', handleSearchInput);
  }

  if (resultsContainer) {
    resultsContainer.addEventListener('click', handleResultClick);
  }
}

export function destroySearchPanel(): void {
  if (searchInput) {
    searchInput.removeEventListener('input', handleSearchInput);
    searchInput = null;
  }

  const resultsContainer = document.getElementById('search-results');
  if (resultsContainer) {
    resultsContainer.removeEventListener('click', handleResultClick);
  }

  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  searchResults = [];
}

export function focusSearch(): void {
  if (searchInput) {
    searchInput.focus();
  }
}
