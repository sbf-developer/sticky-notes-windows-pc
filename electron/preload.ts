import { contextBridge, ipcRenderer } from 'electron';
import type { Note } from '../src/note';

contextBridge.exposeInMainWorld('notes', {
  getNote: (): Promise<Note> => ipcRenderer.invoke('note:get'),
  updateNote: (patch: Partial<Note>): Promise<void> =>
    ipcRenderer.invoke('note:update', patch),
  deleteNote: (): Promise<void> => ipcRenderer.invoke('note:delete'),
});