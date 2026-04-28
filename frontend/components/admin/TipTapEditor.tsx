'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Highlight } from '@tiptap/extension-highlight';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Youtube } from '@tiptap/extension-youtube';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { uploadMediaFile } from '@/lib/admin/api-media';
import { TipTapToolbar } from './TipTapToolbar';

/**
 * TipTap v2 editor — blog içeriği için.
 *
 * Extension set (advanced):
 *  - StarterKit (heading, paragraph, bold, italic, strike, list, bulletList,
 *    orderedList, blockquote, codeBlock disabled — CodeBlockLowlight ile değiştirdik, horizontalRule, history)
 *  - Underline, TextAlign, Highlight, Color, TextStyle
 *  - TaskList + TaskItem (checkbox)
 *  - Table + TableRow + TableHeader + TableCell
 *  - Link (autolink + openOnClick kapalı, XSS için protokol kontrolü)
 *  - Image (drag-drop file upload dahil — lib/admin/api-media kullanıyor)
 *  - Youtube (embed)
 *  - CodeBlockLowlight (highlight.js syntax highlight)
 *
 * Backend'deki sanitize-html (ADIM 15) çıktıyı tekrar filtreliyor; client
 * sanitize gerekmez.
 */
const lowlight = createLowlight(common);

interface TipTapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  disabled?: boolean;
}

export function TipTapEditor({
  value,
  onChange,
  placeholder = 'İçeriğinizi buraya yazın…',
  minHeight = 320,
  disabled,
}: TipTapEditorProps) {
  const editor = useEditor({
    // SSR hydration mismatch uyarısını engeller (Next.js 14)
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        protocols: ['http', 'https', 'mailto'],
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Youtube.configure({ controls: true, nocookie: true, HTMLAttributes: { class: 'tiptap-youtube' } }),
      Table.configure({ resizable: false, HTMLAttributes: { class: 'tiptap-table' } }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: value,
    editable: !disabled,
    editorProps: {
      attributes: {
        class:
          'tiptap-editor prose prose-sm max-w-none focus:outline-none px-4 py-3',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': placeholder,
        'data-placeholder': placeholder,
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const file = files[0];
        if (!file) return false;
        if (!file.type.startsWith('image/')) return false;
        event.preventDefault();
        handleImageUpload(view.state, editor, file);
        return true;
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
  });

  // Dışarıdan `value` reset edilirse (form reset / load) editörü senkronize et
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="rounded-lg border border-kron-light bg-white p-4 text-sm text-kron-gray">
        Editör yükleniyor…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-kron-light bg-white">
      <TipTapToolbar editor={editor} onUploadImage={(file) => handleImageUpload(null, editor, file)} />
      <div
        className="bg-white"
        style={{ minHeight }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

async function handleImageUpload(_state: unknown, editor: Editor | null, file: File) {
  if (!editor) return;
  try {
    const media = await uploadMediaFile(file);
    editor.chain().focus().setImage({ src: media.url, alt: media.altText ?? '' }).run();
  } catch (err) {
    console.error('TipTap image upload failed:', err);
    editor
      .chain()
      .focus()
      .insertContent(`<p class="text-red-600">Görsel yüklenemedi.</p>`)
      .run();
  }
}
