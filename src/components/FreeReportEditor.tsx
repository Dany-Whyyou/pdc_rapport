'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect, useState } from 'react';

interface FreeReportEditorProps {
  initialContent: string;
  onSave: (html: string) => Promise<void>;
  onExportPdf: (html: string) => void;
  onExportWord: (html: string) => void;
  canEdit: boolean;
  readOnly?: boolean;
}

// Toolbar button minimal — factorisation locale, pas assez complexe pour justifier un composant separe.
function ToolbarBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
        active
          ? 'bg-pdc-primary text-white'
          : 'text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-gray-200 mx-1" />;
}

function Toolbar({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL du lien', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-3 py-2 rounded-t-xl">
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        disabled={disabled}
        title="Titre 1"
      >
        H1
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        disabled={disabled}
        title="Titre 2"
      >
        H2
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        disabled={disabled}
        title="Titre 3"
      >
        H3
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setParagraph().run()}
        active={editor.isActive('paragraph')}
        disabled={disabled}
        title="Paragraphe"
      >
        P
      </ToolbarBtn>
      <Divider />
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        disabled={disabled}
        title="Gras (Ctrl+B)"
      >
        <strong>B</strong>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        disabled={disabled}
        title="Italique (Ctrl+I)"
      >
        <em>I</em>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        disabled={disabled}
        title="Souligne (Ctrl+U)"
      >
        <u>U</u>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        disabled={disabled}
        title="Barre"
      >
        <s>S</s>
      </ToolbarBtn>
      <Divider />
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        disabled={disabled}
        title="Liste a puces"
      >
        •
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        disabled={disabled}
        title="Liste numerotee"
      >
        1.
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        disabled={disabled}
        title="Citation"
      >
        ❝
      </ToolbarBtn>
      <Divider />
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        active={editor.isActive({ textAlign: 'left' })}
        disabled={disabled}
        title="Aligne a gauche"
      >
        ⇤
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        active={editor.isActive({ textAlign: 'center' })}
        disabled={disabled}
        title="Centre"
      >
        ↔
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        active={editor.isActive({ textAlign: 'right' })}
        disabled={disabled}
        title="Aligne a droite"
      >
        ⇥
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        active={editor.isActive({ textAlign: 'justify' })}
        disabled={disabled}
        title="Justifie"
      >
        ≡
      </ToolbarBtn>
      <Divider />
      <ToolbarBtn onClick={setLink} active={editor.isActive('link')} disabled={disabled} title="Lien">
        🔗
      </ToolbarBtn>
      <Divider />
      <ToolbarBtn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={disabled || !editor.can().undo()}
        title="Annuler (Ctrl+Z)"
      >
        ↶
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={disabled || !editor.can().redo()}
        title="Refaire (Ctrl+Y)"
      >
        ↷
      </ToolbarBtn>
    </div>
  );
}

export default function FreeReportEditor({
  initialContent,
  onSave,
  onExportPdf,
  onExportWord,
  canEdit,
  readOnly = false,
}: FreeReportEditorProps) {
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState('');

  const editable = canEdit && !readOnly;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: initialContent || '<p></p>',
    editable,
    // eviter le mismatch SSR : Tiptap sait qu'il est en environnement client-only.
    immediatelyRender: false,
  });

  // Sync editable state avec canEdit qui peut changer apres coup
  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editor, editable]);

  if (!editor) {
    return <div className="p-8 text-center text-gray-500">Chargement de l&apos;editeur...</div>;
  }

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      await onSave(editor.getHTML());
      setSavedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {editable && <Toolbar editor={editor} disabled={saving} />}

      <div className="prose prose-sm sm:prose-base max-w-none p-6 min-h-[400px] focus-within:outline-none">
        <EditorContent editor={editor} />
      </div>

      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-gray-500">
          {error ? (
            <span className="text-red-600">{error}</span>
          ) : savedAt ? (
            <>Enregistre a {savedAt.toLocaleTimeString('fr-FR')}</>
          ) : editable ? (
            'Modifications non enregistrees'
          ) : (
            'Lecture seule'
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onExportWord(editor.getHTML())}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-white transition-colors"
          >
            Export Word
          </button>
          <button
            type="button"
            onClick={() => onExportPdf(editor.getHTML())}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-white transition-colors"
          >
            Export PDF
          </button>
          {editable && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 bg-pdc-primary text-white text-sm font-semibold rounded-lg hover:bg-pdc-primary-dark disabled:opacity-50 transition-colors"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
