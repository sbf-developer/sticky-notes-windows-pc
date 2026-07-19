import type { Note } from './note';

declare global {
  interface Window {
    notes: {
      getNote: () => Promise<Note>;
      updateNote: (patch: Partial<Note>) => Promise<void>;
      deleteNote: () => Promise<void>;
    };
  }
}

export {};