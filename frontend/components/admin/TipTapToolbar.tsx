'use client';

import type { Editor } from '@tiptap/react';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  editor: Editor;
  onUploadImage: (file: File) => void;
}

export function TipTapToolbar({ editor, onUploadImage }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Bağlantı URL', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
        alert('Yalnızca http/https/mailto linkleri desteklenir.');
        return;
      }
    } catch {
      alert('Geçersiz URL');
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const setYoutube = () => {
    const url = window.prompt('YouTube URL');
    if (!url) return;
    editor.commands.setYoutubeVideo({ src: url });
  };

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const setHighlightColor = (color: string) => {
    editor.chain().focus().toggleHighlight({ color }).run();
  };

  const setTextColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-kron-light bg-kron-light/30 p-1.5">
      <Group>
        <Btn
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Başlık 2"
        >
          H2
        </Btn>
        <Btn
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Başlık 3"
        >
          H3
        </Btn>
        <Btn
          active={editor.isActive('paragraph')}
          onClick={() => editor.chain().focus().setParagraph().run()}
          title="Paragraf"
        >
          P
        </Btn>
      </Group>

      <Divider />

      <Group>
        <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Kalın">
          <strong>B</strong>
        </Btn>
        <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="İtalik">
          <em>I</em>
        </Btn>
        <Btn
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Altı çizili"
        >
          <span className="underline">U</span>
        </Btn>
        <Btn
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Üstü çizili"
        >
          <s>S</s>
        </Btn>
        <Btn
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Satıriçi kod"
        >
          {'</>'}
        </Btn>
      </Group>

      <Divider />

      <Group>
        <Btn
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Madde listesi"
        >
          •
        </Btn>
        <Btn
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numaralı liste"
        >
          1.
        </Btn>
        <Btn
          active={editor.isActive('taskList')}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title="Görev listesi"
        >
          ☑
        </Btn>
        <Btn
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Alıntı"
        >
          ❝
        </Btn>
      </Group>

      <Divider />

      <Group>
        <Btn
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          title="Sola hizala"
        >
          ⇤
        </Btn>
        <Btn
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          title="Ortala"
        >
          ⇔
        </Btn>
        <Btn
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          title="Sağa hizala"
        >
          ⇥
        </Btn>
      </Group>

      <Divider />

      <Group>
        <ColorBtn onSelect={setTextColor} title="Metin rengi" icon="A" />
        <ColorBtn onSelect={setHighlightColor} title="Vurgu rengi" icon="✎" accent />
      </Group>

      <Divider />

      <Group>
        <Btn active={editor.isActive('link')} onClick={setLink} title="Bağlantı">
          🔗
        </Btn>
        <Btn onClick={() => fileInputRef.current?.click()} title="Görsel yükle">
          🖼
        </Btn>
        <Btn onClick={setYoutube} title="YouTube">
          ▶
        </Btn>
        <Btn onClick={insertTable} title="Tablo ekle">
          ▦
        </Btn>
        <Btn
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Kod bloğu"
        >
          {'{ }'}
        </Btn>
      </Group>

      <Divider />

      <Group>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Yatay çizgi">
          ―
        </Btn>
        <Btn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Biçimi temizle">
          ⨯
        </Btn>
        <Btn onClick={() => editor.chain().focus().undo().run()} title="Geri al">
          ↶
        </Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} title="Yinele">
          ↷
        </Btn>
      </Group>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUploadImage(file);
          e.target.value = '';
        }}
        className="hidden"
      />
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-kron-light" />;
}

function Btn({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={cn(
        'inline-flex h-8 min-w-[32px] items-center justify-center rounded px-2 text-xs font-medium transition-colors',
        active
          ? 'bg-kron-blue text-white'
          : 'text-kron-dark hover:bg-white hover:text-kron-blue',
      )}
    >
      {children}
    </button>
  );
}

const PALETTE = [
  '#0A1628',
  '#1E3A5F',
  '#2E6BE6',
  '#6C8CD5',
  '#F59E0B',
  '#DC2626',
  '#16A34A',
  '#7C3AED',
];

function ColorBtn({
  onSelect,
  title,
  icon,
  accent,
}: {
  onSelect: (color: string) => void;
  title: string;
  icon: string;
  accent?: boolean;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        title={title}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded text-xs font-semibold text-kron-dark hover:bg-white',
          accent && 'text-kron-accent',
        )}
      >
        {icon}
      </button>
      <div className="invisible absolute left-0 top-full z-10 mt-1 flex gap-0.5 rounded-md border border-kron-light bg-white p-1 shadow-card group-hover:visible">
        {PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onSelect(color)}
            style={{ backgroundColor: color }}
            className="h-5 w-5 rounded border border-kron-light/60 hover:scale-110"
            aria-label={color}
          />
        ))}
      </div>
    </div>
  );
}
