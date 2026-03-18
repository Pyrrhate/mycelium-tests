import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useEffect } from 'react';
import { Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3, List } from 'lucide-react';

const ToolbarButton = ({ active, onClick, children, title }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`p-2 rounded border border-gray-700 hover:bg-gray-800 transition ${active ? 'bg-gray-700 text-white' : 'bg-[#1a1a1a] text-gray-400'}`}
  >
    {children}
  </button>
);

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Écrivez ici…',
  minHeight = '200px',
  disabled = false,
  className = '',
  stickyToolbar = true,
  rightSlot = null,
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Placeholder.configure({ placeholder: placeholder || 'Écrivez ici…' }),
    ],
    content: value || '',
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'prose prose-invert focus:outline-none min-h-[240px] px-12 py-12 text-[#e5e5e5] max-w-[720px] mx-auto',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  const onUpdate = useCallback(() => {
    if (editor) onChange?.(editor.getHTML());
  }, [editor, onChange]);

  useEffect(() => {
    if (!editor) return;
    editor.on('update', onUpdate);
    return () => editor.off('update', onUpdate);
  }, [editor, onUpdate]);

  useEffect(() => {
    if (editor) editor.setEditable(!disabled);
  }, [editor, disabled]);

  if (!editor) return null;

  return (
    <div className={`rounded-lg border border-gray-800 bg-[#1a1a1a] overflow-hidden flex flex-col ${className}`}>
      <div className={`flex flex-wrap items-center justify-between gap-2 p-2 border-b border-gray-800 bg-[#222] ${stickyToolbar ? 'sticky top-0 z-10' : ''}`}>
        <div className="flex flex-wrap gap-1">
          <ToolbarButton
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Gras"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italique"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Souligné"
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
          <span className="w-px h-6 bg-gray-700 mx-1" />
          <ToolbarButton
            active={editor.isActive('heading', { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Titre 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Titre 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Titre 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Liste à puces"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
        </div>
        {rightSlot ? <div className="flex items-center gap-2">{rightSlot}</div> : null}
      </div>
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className="flex-1 min-h-0 [&_.ProseMirror]:min-h-0 [&_.ProseMirror]:h-full [&_.ProseMirror]:p-0 [&_.ProseMirror]:text-[#e5e5e5] [&_.ProseMirror]:focus:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-500"
      />
    </div>
  );
}
