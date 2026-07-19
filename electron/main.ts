import { app, BrowserWindow, ipcMain, Tray, Menu } from 'electron';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import type { Note } from '../src/note';

const notesFile = () => join(app.getPath('userData'), 'notes.json');
const windowToNote = new Map<number, string>();
let tray: Tray | null = null;

function loadNotes(): Note[] {
  const path = notesFile();
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function saveNotes(notes: Note[]) {
  const dir = app.getPath('userData');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(notesFile(), JSON.stringify(notes, null, 2));
}

function createDefaultNote(): Note {
  return {
    id: crypto.randomUUID(),
    content: '',
    color: '#FFF9C4',
    x: 100 + Math.random() * 200,
    y: 100 + Math.random() * 200,
    width: 280,
    height: 320,
    alwaysOnTop: false,
    opacity: 1,
    updatedAt: new Date().toISOString(),
  };
}

function openNoteWindow(note: Note) {
  const win = new BrowserWindow({
    width: note.width,
    height: note.height,
    x: note.x,
    y: note.y,
    frame: false,
    transparent: true,
    alwaysOnTop: note.alwaysOnTop,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  windowToNote.set(win.webContents.id, note.id);

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?id=${note.id}`);
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), {
      query: { id: note.id },
    });
  }

  win.on('moved', () => saveWindowBounds(win, note.id));
  win.on('resized', () => saveWindowBounds(win, note.id));
  win.on('closed', () => windowToNote.delete(win.webContents.id));
}

function saveWindowBounds(win: BrowserWindow, noteId: string) {
  const [x, y] = win.getPosition();
  const [width, height] = win.getSize();
  const notes = loadNotes();
  const i = notes.findIndex((n) => n.id === noteId);
  if (i === -1) return;
  notes[i] = { ...notes[i], x, y, width, height, updatedAt: new Date().toISOString() };
  saveNotes(notes);
}

function newNote() {
  const note = createDefaultNote();
  const notes = loadNotes();
  notes.push(note);
  saveNotes(notes);
  openNoteWindow(note);
}

function setupTray() {
  tray = new Tray(join(__dirname, '../../resources/icon.png')); // add a 16x16 png here
  tray.setToolTip('Sticky Notes');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'New note', click: newNote },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ])
  );
}

ipcMain.handle('note:get', (event) => {
  const noteId = windowToNote.get(event.sender.id);
  return loadNotes().find((n) => n.id === noteId) ?? createDefaultNote();
});

ipcMain.handle('note:update', (event, patch: Partial<Note>) => {
  const noteId = windowToNote.get(event.sender.id);
  if (!noteId) return;
  const notes = loadNotes();
  const i = notes.findIndex((n) => n.id === noteId);
  if (i === -1) return;
  notes[i] = { ...notes[i], ...patch, updatedAt: new Date().toISOString() };
  saveNotes(notes);
});

ipcMain.handle('note:delete', (event) => {
  const noteId = windowToNote.get(event.sender.id);
  if (!noteId) return;
  saveNotes(loadNotes().filter((n) => n.id !== noteId));
  BrowserWindow.fromWebContents(event.sender)?.close();
});

app.whenReady().then(() => {
  setupTray();
  const notes = loadNotes();
  if (notes.length === 0) newNote();
  else notes.forEach(openNoteWindow);
});

app.on('window-all-closed', () => {
  // tray-only app — don't quit when windows close
});