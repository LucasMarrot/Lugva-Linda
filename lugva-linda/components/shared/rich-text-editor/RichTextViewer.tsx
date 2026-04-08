'use client';

import type { PartialBlock } from '@blocknote/core';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { NotesBlock } from '@/lib/words/notes';
import styles from './RichTextEditor.module.css';

type RichTextViewerProps = {
  blocks?: NotesBlock[] | null;
  className?: string;
};

export const RichTextViewer = ({ blocks, className }: RichTextViewerProps) => {
  const editor = useCreateBlockNote();

  useEffect(() => {
    const parsedBlocks: PartialBlock[] =
      blocks && blocks.length > 0
        ? (blocks as PartialBlock[])
        : [{ type: 'paragraph' }];

    if (editor.document.length > 0) {
      editor.replaceBlocks(editor.document, parsedBlocks);
      return;
    }

    editor.insertBlocks(
      parsedBlocks,
      editor.getTextCursorPosition().block,
      'before',
    );
  }, [blocks, editor]);

  return (
    <div className={cn(styles.root, styles.viewer, className)}>
      <BlockNoteView
        editor={editor}
        formattingToolbar={false}
        slashMenu={false}
        linkToolbar={false}
        emojiPicker={false}
        filePanel={false}
        tableHandles={false}
        comments={false}
        sideMenu={false}
        editable={false}
        theme="light"
      />
    </div>
  );
};
