'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

type Props = {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  placeholder?: string;
  color?: string;
  bgColor?: string;
};

export default function TagInput({ tags, onChange, suggestions, placeholder, color = '#B76E79', bgColor = '#FDF2F4' }: Props) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter suggestions
  const filtered = input.trim()
    ? suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s))
    : [];

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (!t || tags.includes(t)) return;
    onChange([...tags, t]);
    setInput('');
    setShowSuggestions(false);
    setFocusIdx(-1);
    inputRef.current?.focus();
  };

  const removeTag = (idx: number) => {
    onChange(tags.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (focusIdx >= 0 && focusIdx < filtered.length) {
        addTag(filtered[focusIdx]);
      } else if (input.trim()) {
        addTag(input);
      }
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIdx(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIdx(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 min-h-[38px] rounded-xl border bg-white transition-colors focus-within:ring-2 focus-within:ring-offset-1"
        style={{ borderColor: '#e5e7eb', '--tw-ring-color': color + '40' } as any}
        onClick={() => inputRef.current?.focus()}>
        {tags.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: bgColor, color }}>
            {tag}
            <button onClick={e => { e.stopPropagation(); removeTag(i); }} className="hover:opacity-70">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input ref={inputRef} value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true); setFocusIdx(-1); }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] outline-none text-sm bg-transparent" />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border max-h-[160px] overflow-y-auto">
          {filtered.map((s, i) => (
            <button key={s} onClick={() => addTag(s)}
              className="w-full text-left px-3 py-2 text-sm transition-colors"
              style={{ backgroundColor: focusIdx === i ? bgColor : 'transparent', color: focusIdx === i ? color : '#374151' }}
              onMouseEnter={() => setFocusIdx(i)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* "Add new" hint */}
      {showSuggestions && input.trim() && filtered.length === 0 && !tags.includes(input.trim()) && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border">
          <button onClick={() => addTag(input)} className="w-full text-left px-3 py-2 text-sm" style={{ color }}>
            + &quot;{input.trim()}&quot; {'\uCD94\uAC00'}
          </button>
        </div>
      )}
    </div>
  );
}
