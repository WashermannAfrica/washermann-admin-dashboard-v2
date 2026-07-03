'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Strikethrough, Code, Heading2, Heading3, List, ListOrdered,
  Quote, Minus, Link as LinkIcon, Image as ImageIcon, Undo2, Redo2, Loader2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * TipTap WYSIWYG for blog posts. Emits HTML — the API sanitizes it again
 * server-side, so this editor's output is a convenience, not a security boundary.
 */
export function RichTextEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Branded dialogs replace window.prompt/alert
  const [pendingImage, setPendingImage] = useState<string | null>(null); // uploaded URL awaiting alt text
  const [altText, setAltText] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const editor = useEditor({
    editable: !disabled,
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: 'Write your post…' }),
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose-blog min-h-[320px] max-w-none px-4 py-3 focus:outline-none text-[15px] leading-7 text-ink',
      },
    },
  });

  // Keep editable state in sync with the workflow (e.g. locked while in review)
  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  const openLinkDialog = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    setLinkUrl(prev ?? 'https://');
    setLinkOpen(true);
  }, [editor]);

  function applyLink() {
    if (!editor) return;
    const url = linkUrl.trim();
    if (url === '' || url === 'https://') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
    setLinkOpen(false);
  }

  async function uploadImage(file: File) {
    if (!editor) return;
    setUploading(true);
    setUploadError('');
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await api.post<{ data: { url: string } }>('/upload/blog-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAltText('');
      setPendingImage(res.data.data.url); // opens the alt-text dialog
    } catch {
      setUploadError('Image upload failed — check the file (jpg/png/webp, max 5 MB) and try again.');
    } finally {
      setUploading(false);
    }
  }

  function insertPendingImage() {
    if (!editor || !pendingImage) return;
    editor.chain().focus().setImage({ src: pendingImage, alt: altText.trim() }).run();
    setPendingImage(null);
    setAltText('');
  }

  if (!editor) return null;

  const Btn = ({
    onClick, active, label, children,
  }: { onClick: () => void; active?: boolean; label: string; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg text-body transition-colors',
        active ? 'bg-mint-soft text-forest' : 'hover:bg-section',
        disabled && 'opacity-40',
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn('rounded-2xl border border-line bg-white', disabled && 'bg-section/50')}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-2 py-1.5">
        <Btn label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={15} /></Btn>
        <Btn label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={15} /></Btn>
        <Btn label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={15} /></Btn>
        <Btn label="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}><Code size={15} /></Btn>
        <span className="mx-1 h-5 w-px bg-line" />
        <Btn label="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={15} /></Btn>
        <Btn label="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={15} /></Btn>
        <span className="mx-1 h-5 w-px bg-line" />
        <Btn label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={15} /></Btn>
        <Btn label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={15} /></Btn>
        <Btn label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={15} /></Btn>
        <Btn label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={15} /></Btn>
        <span className="mx-1 h-5 w-px bg-line" />
        <Btn label="Link" active={editor.isActive('link')} onClick={openLinkDialog}><LinkIcon size={15} /></Btn>
        <Btn label="Insert image" onClick={() => !uploading && fileInputRef.current?.click()}>
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
        </Btn>
        <span className="mx-1 h-5 w-px bg-line" />
        <Btn label="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo2 size={15} /></Btn>
        <Btn label="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo2 size={15} /></Btn>
      </div>

      {uploadError && (
        <p className="border-b border-line bg-danger-bg px-4 py-2 text-xs text-danger">{uploadError}</p>
      )}

      <EditorContent editor={editor} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadImage(f);
          e.target.value = '';
        }}
      />

      {/* Alt-text dialog — shown after upload, before the image lands in the post */}
      <Modal open={!!pendingImage} onClose={insertPendingImage} title="Describe this image">
        <div className="space-y-4">
          {pendingImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pendingImage} alt="" className="max-h-56 w-full rounded-2xl border border-line object-contain" />
          )}
          <Input
            label="Alt text"
            placeholder="e.g. A rep loading laundry bags onto a delivery bike"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); insertPendingImage(); } }}
            autoFocus
          />
          <p className="text-xs text-faint">
            Screen readers read this aloud, and search engines index it. One plain sentence describing what&apos;s in the picture.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setPendingImage(null); setAltText(''); }}>
              Discard image
            </Button>
            <Button className="flex-1" onClick={insertPendingImage}>
              {altText.trim() ? 'Insert image' : 'Insert without alt'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Link dialog */}
      <Modal open={linkOpen} onClose={() => setLinkOpen(false)} title="Add link">
        <div className="space-y-4">
          <Input
            label="URL"
            placeholder="https://…"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyLink(); } }}
            autoFocus
          />
          <p className="text-xs text-faint">Leave empty to remove an existing link from the selected text.</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setLinkOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={applyLink}>
              {linkUrl.trim() && linkUrl.trim() !== 'https://' ? 'Apply link' : 'Remove link'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
