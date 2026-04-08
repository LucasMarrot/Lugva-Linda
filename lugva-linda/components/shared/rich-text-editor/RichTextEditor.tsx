'use client';

import type { Block, PartialBlock } from '@blocknote/core';
import { fr } from '@blocknote/core/locales';
import { filterSuggestionItems } from '@blocknote/core/extensions';
import {
  BasicTextStyleButton,
  BlockTypeSelect,
  FormattingToolbar,
  FormattingToolbarController,
  SuggestionMenuController,
  TextAlignButton,
  blockTypeSelectItems,
  getDefaultReactSlashMenuItems,
  useCreateBlockNote,
} from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import styles from './RichTextEditor.module.css';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onBlurSave?: (blocks: Block[]) => void;
  disabled?: boolean;
  className?: string;
}

export const RichTextEditor = ({
  value,
  onChange,
  onBlurSave,
  disabled = false,
  className,
}: RichTextEditorProps) => {
  const lastSyncedHtmlRef = useRef<string>('');

  const editorDictionary = useMemo(
    () => ({
      ...fr,
      placeholders: {
        ...fr.placeholders,
        default: "Tapez du texte ou '/'.",
      },
      slash_menu: {
        ...fr.slash_menu,
        heading: {
          ...fr.slash_menu.heading,
          subtext: 'Titre de premier niveau',
        },
        heading_2: {
          ...fr.slash_menu.heading_2,
          subtext: 'Titre de deuxième niveau',
        },
        heading_3: {
          ...fr.slash_menu.heading_3,
          subtext: 'Titre de troisième niveau',
        },
      },
    }),
    [],
  );

  const editor = useCreateBlockNote({
    dictionary: editorDictionary,
  });

  const allowedBlockTypeItems = useMemo(
    () =>
      blockTypeSelectItems(editor.dictionary).filter((item) => {
        if (item.type === 'heading') {
          const headingLevel = item.props?.level;
          const isToggleable = item.props?.isToggleable;

          return (
            (headingLevel === 1 || headingLevel === 2 || headingLevel === 3) &&
            isToggleable !== true
          );
        }

        return (
          item.type === 'paragraph' ||
          item.type === 'quote' ||
          item.type === 'bulletListItem' ||
          item.type === 'numberedListItem'
        );
      }),
    [editor.dictionary],
  );

  const allowedSlashMenuItems = useMemo(() => {
    const dict = editor.dictionary;
    const allowedTitles = new Set([
      dict.slash_menu.paragraph.title,
      dict.slash_menu.heading.title,
      dict.slash_menu.heading_2.title,
      dict.slash_menu.heading_3.title,
      dict.slash_menu.quote.title,
      dict.slash_menu.bullet_list.title,
      dict.slash_menu.numbered_list.title,
    ]);

    return getDefaultReactSlashMenuItems(editor).filter((item) =>
      allowedTitles.has(item.title),
    );
  }, [editor]);

  const getAllowedSlashMenuItems = useCallback(
    async (query: string) =>
      filterSuggestionItems(allowedSlashMenuItems, query),
    [allowedSlashMenuItems],
  );

  useEffect(() => {
    const nextHtml = value.trim();
    if (nextHtml === lastSyncedHtmlRef.current) {
      return;
    }

    const parsedBlocks: PartialBlock[] = nextHtml
      ? editor.tryParseHTMLToBlocks(nextHtml)
      : [{ type: 'paragraph' }];

    if (editor.document.length > 0) {
      editor.replaceBlocks(editor.document, parsedBlocks);
    } else {
      editor.insertBlocks(
        parsedBlocks,
        editor.getTextCursorPosition().block,
        'before',
      );
    }

    lastSyncedHtmlRef.current = editor.blocksToHTMLLossy(editor.document);
  }, [editor, value]);

  const handleEditorChange = () => {
    const html = editor.blocksToHTMLLossy(editor.document);
    lastSyncedHtmlRef.current = html;
    onChange(html);
  };

  const handleBlur = () => {
    onBlurSave?.(editor.document);
  };

  return (
    <div
      className={cn(
        'border-border/70 bg-card focus-within:border-ring/60 focus-within:ring-ring/15 rounded-xl border shadow-sm transition-[border-color,box-shadow] duration-200 focus-within:ring-4',
        styles.root,
        disabled && styles.disabled,
        className,
      )}
    >
      <BlockNoteView
        editor={editor}
        onChange={handleEditorChange}
        onBlur={handleBlur}
        formattingToolbar={false}
        slashMenu={false}
        linkToolbar={false}
        emojiPicker={true}
        filePanel={false}
        tableHandles={false}
        comments={false}
        sideMenu={!disabled}
        editable={!disabled}
        theme="light"
        className="min-h-36"
      >
        <FormattingToolbarController
          formattingToolbar={() => (
            <FormattingToolbar blockTypeSelectItems={allowedBlockTypeItems}>
              <BlockTypeSelect items={allowedBlockTypeItems} />

              <BasicTextStyleButton basicTextStyle="bold" />
              <BasicTextStyleButton basicTextStyle="italic" />
              <BasicTextStyleButton basicTextStyle="underline" />
              <BasicTextStyleButton basicTextStyle="strike" />

              <TextAlignButton textAlignment="left" />
              <TextAlignButton textAlignment="center" />
              <TextAlignButton textAlignment="right" />
              <TextAlignButton textAlignment="justify" />
            </FormattingToolbar>
          )}
        />

        <SuggestionMenuController
          triggerCharacter="/"
          getItems={getAllowedSlashMenuItems}
        />
      </BlockNoteView>
    </div>
  );
};
