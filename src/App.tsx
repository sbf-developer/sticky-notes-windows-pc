import { useEffect, useState } from 'react';
import type { Note } from './note';

const COLORS = ['#FFF9C4', '#E8F5E9', '#E3F2FD', '#F3E5F5', '#FAFAFA'];

export default function App() {
  const [note, setNote] = useState<Note | null>(null);
  const [content, setContent] = useState('');

  useEffect(() => {
    window.notes.getNote().then((n) => {
      setNote(n);
      setContent(n.content);
    });
  }, []);

  useEffect(() => {
    if (!note) return;
    const timer = setTimeout(() => {
      window.notes.updateNote({ content });
    }, 300);
    return () => clearTimeout(timer);
  }, [content, note]);

  if (!note) return null;

  return (
    <div className="note" style={{ background: note.color }}>
      <header className="drag">Sticky Note</header>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write something…"
        autoFocus
      />
      <footer className="colors">
        {COLORS.map((color) => (
          <button
            key={color}
            style={{ background: color }}
            onClick={() => {
              setNote({ ...note, color });
              window.notes.updateNote({ color });
            }}
          />
        ))}
      </footer>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; }
        body { font-family: "Segoe UI", sans-serif; background: transparent; }
        .note {
          height: 100%;
          display: flex;
          flex-direction: column;
          border-radius: 10px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.15);
          overflow: hidden;
        }
        .drag {
          -webkit-app-region: drag;
          padding: 8px 12px;
          font-size: 12px;
          opacity: 0.5;
        }
        textarea {
          -webkit-app-region: no-drag;
          flex: 1;
          border: none;
          background: transparent;
          resize: none;
          padding: 8px 12px;
          font-size: 14px;
          line-height: 1.5;
          outline: none;
        }
        .colors {
          -webkit-app-region: no-drag;
          display: flex;
          gap: 6px;
          padding: 8px 12px;
        }
        .colors button {
          width: 20px;
          height: 20px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}