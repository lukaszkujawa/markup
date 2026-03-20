import { getState } from './state';

export interface SearchResult {
  notePath: string;
  noteTitle: string;
  matches: SearchMatch[];
  score: number;
}

export interface SearchMatch {
  text: string;
  startIndex: number;
  endIndex: number;
  lineNumber: number;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getContextAroundMatch(content: string, matchIndex: number, contextLength: number = 60): string {
  const start = Math.max(0, matchIndex - contextLength);
  const end = Math.min(content.length, matchIndex + contextLength);

  let context = content.substring(start, end);

  if (start > 0) {
    context = '...' + context;
  }
  if (end < content.length) {
    context = context + '...';
  }

  return context.trim();
}

export function searchNotes(query: string): SearchResult[] {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const state = getState();
  const results: SearchResult[] = [];
  const searchTerm = query.trim();
  const escapedQuery = escapeRegExp(searchTerm);

  Object.entries(state.notes).forEach(([notePath, note]) => {
    const titleMatches: SearchMatch[] = [];
    const contentMatches: SearchMatch[] = [];

    let titleMatch;
    const titleRegex = new RegExp(escapedQuery, 'gi');
    while ((titleMatch = titleRegex.exec(note.title)) !== null) {
      titleMatches.push({
        text: note.title,
        startIndex: titleMatch.index,
        endIndex: titleMatch.index + titleMatch[0].length,
        lineNumber: 0,
      });
    }

    const lines = note.content.split('\n');
    lines.forEach((line, lineIndex) => {
      let match;
      const lineRegex = new RegExp(escapedQuery, 'gi');
      while ((match = lineRegex.exec(line)) !== null) {
        const matchText = getContextAroundMatch(line, match.index, 50);
        contentMatches.push({
          text: matchText,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          lineNumber: lineIndex + 1,
        });
      }
    });

    const totalMatches = titleMatches.length + contentMatches.length;
    if (totalMatches > 0) {
      const titleScore = titleMatches.length * 10;
      const contentScore = contentMatches.length;
      const score = titleScore + contentScore;

      results.push({
        notePath,
        noteTitle: note.title,
        matches: [...titleMatches.slice(0, 1), ...contentMatches.slice(0, 5)],
        score,
      });
    }
  });

  return results.sort((a, b) => b.score - a.score);
}
