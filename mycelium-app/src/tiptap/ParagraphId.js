import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const ParagraphId = Extension.create({
  name: 'paragraphId',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          paragraphId: {
            default: null,
            renderHTML: (attrs) => (attrs.paragraphId ? { 'data-paragraph-id': attrs.paragraphId } : {}),
            parseHTML: (element) => element.getAttribute('data-paragraph-id') || null,
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    return [
      // Assigne automatiquement un ID aux paragraphes qui n’en ont pas.
      // Utilise appendTransaction pour éviter les boucles.
      new Plugin({
        appendTransaction: (_transactions, _oldState, newState) => {
          const { doc, tr } = newState;
          let changed = false;

          doc.descendants((node, pos) => {
            if (node.type.name !== 'paragraph') return;
            if (node.attrs?.paragraphId) return;
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, paragraphId: makeId() }, node.marks);
            changed = true;
          });

          return changed ? tr : null;
        },
      }),
    ];
  },
});

export default ParagraphId;

