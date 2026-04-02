'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { Bold, Italic, Underline } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type NotesEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

type FormatState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
};

type LegacyDocumentCommandApi = {
  execCommand: (commandId: string, showUI?: boolean, value?: string) => boolean;
  queryCommandState: (commandId: string) => boolean;
};

const emptyFormatState: FormatState = {
  bold: false,
  italic: false,
  underline: false,
};

export const NotesEditor = ({
  value,
  onChange,
  disabled = false,
}: NotesEditorProps) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastAppliedValueRef = useRef<string | null>(null);
  const [formatState, setFormatState] = useState<FormatState>(emptyFormatState);

  const getCommandApi = () => document as unknown as LegacyDocumentCommandApi;

  useEffect(() => {
    if (!editorRef.current) return;
    if (value === lastAppliedValueRef.current) return;

    const isFocused = document.activeElement === editorRef.current;
    if (isFocused) return;

    editorRef.current.innerHTML = value;
    lastAppliedValueRef.current = value;
  }, [value]);

  const syncEditorValue = useCallback(() => {
    if (!editorRef.current) return;

    const html = editorRef.current.innerHTML;
    lastAppliedValueRef.current = html;
    onChange(html);
  }, [onChange]);

  const refreshFormatState = useCallback(() => {
    if (!editorRef.current) return;

    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setFormatState(emptyFormatState);
      return;
    }

    const anchorNode = selection.anchorNode;
    if (!anchorNode || !editorRef.current.contains(anchorNode)) {
      setFormatState(emptyFormatState);
      return;
    }

    setFormatState({
      bold: getCommandApi().queryCommandState('bold'),
      italic: getCommandApi().queryCommandState('italic'),
      underline: getCommandApi().queryCommandState('underline'),
    });
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => refreshFormatState();

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [refreshFormatState]);

  const executeFormat = (command: 'bold' | 'italic' | 'underline') => {
    if (!editorRef.current || disabled) return;

    editorRef.current.focus();
    getCommandApi().execCommand(command, false);
    syncEditorValue();
    refreshFormatState();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    const hasModifier = event.metaKey || event.ctrlKey;
    if (!hasModifier || event.altKey) return;

    const key = event.key.toLowerCase();
    if (key === 'b' || key === 'i' || key === 'u') {
      event.preventDefault();

      if (key === 'b') executeFormat('bold');
      if (key === 'i') executeFormat('italic');
      if (key === 'u') executeFormat('underline');
    }
  };

  return (
    <div className="bg-background border-border/70 overflow-hidden rounded-xl border shadow-xs">
      <div className="bg-muted/50 border-border/60 flex items-center gap-1 border-b p-1.5 sm:p-2">
        <Button
          type="button"
          variant={formatState.bold ? 'default' : 'ghost'}
          size="icon-sm"
          onClick={() => executeFormat('bold')}
          disabled={disabled}
          aria-label="Mettre en gras"
          className="h-10 w-10 sm:h-8 sm:w-8"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={formatState.italic ? 'default' : 'ghost'}
          size="icon-sm"
          onClick={() => executeFormat('italic')}
          disabled={disabled}
          aria-label="Mettre en italique"
          className="h-10 w-10 sm:h-8 sm:w-8"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={formatState.underline ? 'default' : 'ghost'}
          size="icon-sm"
          onClick={() => executeFormat('underline')}
          disabled={disabled}
          aria-label="Souligner"
          className="h-10 w-10 sm:h-8 sm:w-8"
        >
          <Underline className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder="Ajoute des notes utiles, exemples ou nuances..."
        onInput={syncEditorValue}
        onBlur={refreshFormatState}
        onKeyDown={handleKeyDown}
        onKeyUp={refreshFormatState}
        onMouseUp={refreshFormatState}
        onPaste={(event) => {
          event.preventDefault();
          const text = event.clipboardData.getData('text/plain');
          getCommandApi().execCommand('insertText', false, text);
          syncEditorValue();
        }}
        className={cn(
          'min-h-36 w-full px-4 py-3 text-sm leading-6 outline-none',
          'empty:before:text-muted-foreground/80 empty:before:pointer-events-none empty:before:content-[attr(data-placeholder)]',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      />
    </div>
  );
};
