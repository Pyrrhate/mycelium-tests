import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  Loader2,
  MessageSquarePlus,
  PilcrowLeft,
  Quote,
  Underline as UnderlineIcon,
  Wand2,
} from 'lucide-react';
import PageAppearanceMenu from './PageAppearanceMenu';
import ParagraphAnnotationsOverlay from './ParagraphAnnotationsOverlay';
import ParagraphAnnotationSheet from './ParagraphAnnotationSheet';
import ParagraphId from '../tiptap/ParagraphId';
import { supabase } from '../supabaseClient';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const ToolbarButton = ({ active, onClick, children, title, isEink = false, className = '' }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`p-2 rounded border transition ${className} ${
      isEink
        ? `${active ? 'bg-[#ECECEC] text-[#1A1A1A] border-[#D9D9D9]' : 'bg-[#F8F8F8] text-[#3A3A3A] border-[#DEDEDE] hover:bg-[#EFEFEF]'}`
        : `${active ? 'bg-gray-700 text-white border-gray-700' : 'bg-[#1a1a1a] text-gray-400 border-gray-700 hover:bg-gray-800'}`
    }`}
  >
    {children}
  </button>
);

const proofreadPluginKey = new PluginKey('proofread-selection');

const ProofreadSelectionDecoration = Extension.create({
  name: 'proofreadSelectionDecoration',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: proofreadPluginKey,
        state: {
          init: () => ({ active: false }),
          apply(tr, value) {
            const next = tr.getMeta(proofreadPluginKey);
            if (next && typeof next.active === 'boolean') return { active: next.active };
            return value;
          },
        },
        props: {
          decorations(state) {
            const pluginState = proofreadPluginKey.getState(state);
            if (!pluginState?.active) return null;
            const { from, to } = state.selection;
            if (from === to) return null;
            return DecorationSet.create(state.doc, [
              Decoration.inline(from, to, { class: 'sj-proofreading-selection' }),
            ]);
          },
        },
      }),
    ];
  },
});

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Écrivez ici…',
  minHeight = '200px',
  disabled = false,
  className = '',
  stickyToolbar = true,
  rightSlot = null,
  pageAppearance = 'default', // 'default' | 'grain' | 'lines' | 'dots'
  onPageAppearanceChange,
  annotations = [],
  onAnnotationsChange,
  isMobile = false,
  onMentorClick,
  spellcheck = true,
  density = 'comfortable', // 'comfortable' | 'compact'
  onDensityChange,
  visualStyle = 'dark', // 'dark' | 'eink'
  disableAiActions = false,
}) {
  const surfaceRef = useRef(null);
  const [openParagraphId, setOpenParagraphId] = useState(null);
  const [proofreading, setProofreading] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimerRef = useRef(null);

  const isEink = visualStyle === 'eink';

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      ParagraphId,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ProofreadSelectionDecoration,
      Placeholder.configure({ placeholder: placeholder || 'Écrivez ici…' }),
    ],
    content: value || '',
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'prose focus:outline-none min-h-[240px] px-4 py-4 md:px-12 md:py-12 md:max-w-[720px] md:mx-auto',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Tab') {
          event.preventDefault();
          const { from, to } = view.state.selection;
          const tr = view.state.tr.insertText('    ', from, to);
          view.dispatch(tr);
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const cls = isEink
      ? 'prose prose-neutral focus:outline-none min-h-[360px] max-w-3xl mx-auto px-12 py-16 text-[#1A1A1A] leading-relaxed break-words overflow-x-hidden'
      : density === 'compact'
        ? 'prose focus:outline-none min-h-[240px] px-4 py-4 max-w-full mx-0 text-sm leading-relaxed'
        : 'prose focus:outline-none min-h-[240px] px-4 py-4 md:px-12 md:py-12 md:max-w-[720px] md:mx-auto';
    editor.setOptions({
      editorProps: { attributes: { class: cls } },
    });
  }, [editor, density, isEink]);

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

  const showToast = (text) => {
    setToast(text);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(''), 2200);
  };

  const selectionHasText = () => {
    const { from, to } = editor.state.selection;
    return to > from;
  };

  const getSelectedText = () => {
    const { from, to } = editor.state.selection;
    if (to <= from) return '';
    return editor.state.doc.textBetween(from, to, '\n').trim();
  };

  const setSelectionDecorationActive = (active) => {
    const tr = editor.state.tr.setMeta(proofreadPluginKey, { active });
    editor.view.dispatch(tr);
  };

  const handleProofread = async () => {
    if (!supabase) {
      showToast('Supabase non configuré.');
      return;
    }
    if (proofreading) return;
    if (!selectionHasText()) return;
    const selected_text = getSelectedText();
    if (!selected_text) return;

    const { from, to } = editor.state.selection;
    setProofreading(true);
    setSelectionDecorationActive(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-proofread', { body: { selected_text } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const corrected = String(data?.result || '').trim();
      if (!corrected) throw new Error('Réponse vide.');

      editor.chain().focus().insertContentAt({ from, to }, corrected).run();
      showToast('Correction appliquée avec succès.');
    } catch (err) {
      const msg = err?.message || 'Erreur de correction.';
      showToast(msg);
    } finally {
      setSelectionDecorationActive(false);
      setProofreading(false);
    }
  };

  const applyFontToWholeNote = (font) => {
    editor.chain().focus().selectAll().setFontFamily(font).run();
    // Rétablir une sélection "normale" après selectAll
    editor.commands.setTextSelection(editor.state.selection.to);
  };

  const TEXT_COLORS = [
    { id: 'default', label: 'Auto', value: null },
    { id: 'ink', label: 'Encre', value: '#1A1A1A' },
    { id: 'slate', label: 'Ardoise', value: '#334155' },
    { id: 'brown', label: 'Brun', value: '#6B4F3A' },
    { id: 'forest', label: 'Forêt', value: '#2F5D50' },
    { id: 'navy', label: 'Marine', value: '#2D4565' },
  ];

  const HIGHLIGHTS = [
    { id: 'none', label: 'Aucun', value: null },
    { id: 'sand', label: 'Sable', value: 'rgba(196, 170, 118, 0.28)' },
    { id: 'sage', label: 'Sauge', value: 'rgba(147, 170, 144, 0.28)' },
    { id: 'mist', label: 'Brume', value: 'rgba(158, 176, 196, 0.26)' },
    { id: 'rose', label: 'Rose pâle', value: 'rgba(197, 162, 168, 0.22)' },
  ];

  const FONTS = [
    { id: 'sans', label: 'Sans', value: 'Inter' },
    { id: 'hand', label: 'Manuscrite', value: 'Kalam' },
    { id: 'system', label: 'Système', value: 'system-ui' },
  ];

  return (
    <div className={`rounded-lg border overflow-hidden flex flex-col ${isEink ? 'border-[#E1E1E1] bg-[#FDFDFD]' : 'border-gray-800 bg-[#1a1a1a]'} ${className}`}>
      {toast ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/15 text-emerald-200 px-4 py-2 text-sm shadow-xl shadow-black/40">
            {toast}
          </div>
        </div>
      ) : null}

      {!disableAiActions && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 120, placement: 'top' }}
          shouldShow={() => {
            if (disabled) return false;
            const { from, to } = editor.state.selection;
            return to > from;
          }}
        >
          <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-[#111111] px-2 py-1 shadow-xl shadow-black/40">
            <button
              type="button"
              onClick={handleProofread}
              disabled={proofreading || !selectionHasText()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition"
              title="Corriger la sélection"
            >
              {proofreading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Corriger
            </button>
            <span className="text-xs text-gray-500 hidden sm:inline">Sélection uniquement</span>
          </div>
        </BubbleMenu>
      )}

      <div className={`flex flex-wrap items-center justify-between gap-2 p-2 border-b ${isEink ? 'border-[#E5E5E5] bg-[#FAFAFA]' : 'border-gray-800 bg-[#222]'} ${stickyToolbar ? 'sticky top-0 z-10' : ''}`}>
        <div className="flex flex-wrap gap-1">
          <ToolbarButton
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Gras"
            isEink={isEink}
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italique"
            isEink={isEink}
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Souligné"
            isEink={isEink}
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
          <span className={`w-px h-6 mx-1 ${isEink ? 'bg-[#DDDDDD]' : 'bg-gray-700'}`} />
          <ToolbarButton
            active={editor.isActive('heading', { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Titre 1"
            isEink={isEink}
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Titre 2"
            isEink={isEink}
            className="hidden sm:inline-flex"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Titre 3"
            isEink={isEink}
            className="hidden sm:inline-flex"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Liste à puces"
            isEink={isEink}
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Citation"
            isEink={isEink}
            className="hidden sm:inline-flex"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('codeBlock')}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Bloc de code"
            isEink={isEink}
            className="hidden sm:inline-flex"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            active={false}
            onClick={() => editor.chain().focus().insertContent('&nbsp;&nbsp;&nbsp;&nbsp;').run()}
            title="Tabulation"
            isEink={isEink}
          >
            <PilcrowLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            title="Aligner à gauche"
            isEink={isEink}
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            title="Centrer"
            isEink={isEink}
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive({ textAlign: 'justify' })}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            title="Justifier"
            isEink={isEink}
            className="hidden sm:inline-flex"
          >
            <AlignJustify className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            active={false}
            onClick={() => {
              const { state, view } = editor;
              const { $from } = state.selection;
              let paragraphPos = null;
              for (let d = $from.depth; d > 0; d -= 1) {
                const node = $from.node(d);
                if (node.type.name === 'paragraph') {
                  paragraphPos = $from.before(d);
                  break;
                }
              }
              if (paragraphPos == null) return;
              const node = state.doc.nodeAt(paragraphPos);
              if (!node) return;
              const paragraphId = node.attrs?.paragraphId || (crypto.randomUUID?.() || Date.now().toString());
              if (!node.attrs?.paragraphId) {
                const tr = state.tr.setNodeMarkup(paragraphPos, undefined, { ...node.attrs, paragraphId }, node.marks);
                view.dispatch(tr);
              }
              setOpenParagraphId(paragraphId);
            }}
            title="Annoter ce paragraphe"
            isEink={isEink}
            className="hidden sm:inline-flex"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </ToolbarButton>
        </div>
        <div className="flex items-center gap-2">
          {!disableAiActions && (
            <button
              type="button"
              onClick={onMentorClick}
              className="px-3 py-2 rounded-lg text-sm border border-gray-700 text-gray-200 hover:bg-gray-800/50 transition"
              title="Mentor éditorial (Premium)"
            >
              🧠 Mentor
            </button>
          )}
          <select
            value={density}
            onChange={(e) => onDensityChange?.(e.target.value)}
            className={`px-2 py-2 rounded-lg border text-xs transition ${isEink ? 'border-[#DDDDDD] bg-[#FFFFFF] text-[#2A2A2A] hover:bg-[#F4F4F4]' : 'border-gray-800 bg-[#1a1a1a] text-gray-300 hover:bg-gray-800/40'}`}
            title="Densité"
          >
            <option value="comfortable">Confort</option>
            <option value="compact">Compact</option>
          </select>
          <select
            value={editor.getAttributes('textStyle').color || ''}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) editor.chain().focus().unsetColor().run();
              else editor.chain().focus().setColor(v).run();
            }}
            className={`hidden sm:inline-flex px-2 py-2 rounded-lg border text-xs transition ${isEink ? 'border-[#DDDDDD] bg-[#FFFFFF] text-[#2A2A2A]' : 'border-gray-800 bg-[#1a1a1a] text-gray-300'}`}
            title="Couleur du texte"
          >
            {TEXT_COLORS.map((c) => (
              <option key={c.id} value={c.value || ''}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={editor.getAttributes('highlight').color || ''}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) editor.chain().focus().unsetHighlight().run();
              else editor.chain().focus().setHighlight({ color: v }).run();
            }}
            className={`hidden sm:inline-flex px-2 py-2 rounded-lg border text-xs transition ${isEink ? 'border-[#DDDDDD] bg-[#FFFFFF] text-[#2A2A2A]' : 'border-gray-800 bg-[#1a1a1a] text-gray-300'}`}
            title="Surlignage"
          >
            {HIGHLIGHTS.map((h) => (
              <option key={h.id} value={h.value || ''}>
                {h.label}
              </option>
            ))}
          </select>

          <select
            value={editor.getAttributes('textStyle').fontFamily || ''}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) editor.chain().focus().unsetFontFamily().run();
              else applyFontToWholeNote(v);
            }}
            className={`hidden sm:inline-flex px-2 py-2 rounded-lg border text-xs transition ${isEink ? 'border-[#DDDDDD] bg-[#FFFFFF] text-[#2A2A2A]' : 'border-gray-800 bg-[#1a1a1a] text-gray-300'}`}
            title="Typographie"
          >
            <option value="">Typographie</option>
            {FONTS.map((f) => (
              <option key={f.id} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          {!isEink && <PageAppearanceMenu value={pageAppearance} onChange={onPageAppearanceChange} />}
          {rightSlot ? <div className="flex items-center gap-2">{rightSlot}</div> : null}
        </div>
      </div>
      <div
        className={`relative flex-1 min-h-0 sj-editor-surface sj-page-surface ${
          pageAppearance === 'grain'
            ? 'sj-page-grain'
            : pageAppearance === 'lines'
              ? 'sj-page-lines'
              : pageAppearance === 'dots'
                ? 'sj-page-dots'
                : 'sj-page-default'
        }`}
        ref={surfaceRef}
      >
        <div className="absolute inset-0 pointer-events-none hidden md:block">
          {/* marge droite desktop */}
          <div className="absolute top-0 right-0 w-64 h-full" />
        </div>
        <EditorContent
          editor={editor}
          style={{
            minHeight,
            ...(isEink ? { fontFamily: '\'EB Garamond\', \'Crimson Pro\', serif' } : {}),
            ...(isEink ? { color: '#1A1A1A' } : {}),
          }}
          spellCheck={spellcheck}
          className={`flex-1 min-h-0 overflow-x-hidden [&_.ProseMirror]:min-h-[240px] [&_.ProseMirror]:p-0 [&_.ProseMirror]:focus:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-[color:var(--text-muted)] ${
            isEink
              ? '[&_.ProseMirror]:text-[#1A1A1A] [&_.ProseMirror_h1]:text-4xl [&_.ProseMirror_h1]:font-semibold [&_.ProseMirror_h2]:text-3xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror]:overflow-x-hidden'
              : '[&_.ProseMirror]:text-[color:var(--text-main)]'
          }`}
        />

        <ParagraphAnnotationsOverlay
          editor={editor}
          surfaceRef={surfaceRef}
          annotations={annotations}
          isMobile={isMobile}
          onOpenAnnotation={(pid) => setOpenParagraphId(pid)}
        />

        <ParagraphAnnotationSheet
          open={!!openParagraphId}
          paragraphId={openParagraphId}
          annotations={annotations}
          onClose={() => setOpenParagraphId(null)}
          onChange={onAnnotationsChange}
        />
      </div>
    </div>
  );
}
