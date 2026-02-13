import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { GrammarIssue } from './types';

export const grammarPluginKey = new PluginKey('grammarDecorations');

const CATEGORY_CLASSES: Record<string, string> = {
  spelling: 'grammar-underline-spelling',
  grammar: 'grammar-underline-grammar',
  style: 'grammar-underline-style',
};

function buildDecorations(issues: GrammarIssue[], docSize: number): DecorationSet {
  const decorations: Decoration[] = [];

  for (const issue of issues) {
    const { pmFrom, pmTo, id, category } = issue;
    // Validate range is within doc bounds
    if (pmFrom < 0 || pmTo > docSize || pmFrom >= pmTo) continue;

    decorations.push(
      Decoration.inline(pmFrom, pmTo, {
        class: CATEGORY_CLASSES[category] ?? CATEGORY_CLASSES.grammar,
        'data-grammar-issue-id': id,
      }),
    );
  }

  return DecorationSet.empty.add(
    // We need a doc reference but DecorationSet.create is the proper API
    // However we can't access doc from here in a static way,
    // so we handle this in the plugin state init
    undefined as any,
    decorations,
  );
}

function createGrammarPlugin(): Plugin {
  return new Plugin({
    key: grammarPluginKey,
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, decoSet) {
        // Check for grammar meta
        const meta = tr.getMeta(grammarPluginKey);
        if (meta?.issues) {
          const issues: GrammarIssue[] = meta.issues;
          if (issues.length === 0) return DecorationSet.empty;

          const decorations: Decoration[] = [];
          for (const issue of issues) {
            const { pmFrom, pmTo, id, category } = issue;
            if (pmFrom < 0 || pmTo > tr.doc.content.size || pmFrom >= pmTo) continue;
            decorations.push(
              Decoration.inline(pmFrom, pmTo, {
                class: CATEGORY_CLASSES[category] ?? CATEGORY_CLASSES.grammar,
                'data-grammar-issue-id': id,
              }),
            );
          }
          return DecorationSet.create(tr.doc, decorations);
        }

        // If doc changed, map existing decorations through the transaction mapping
        if (tr.docChanged) {
          return decoSet.map(tr.mapping, tr.doc);
        }

        return decoSet;
      },
    },
    props: {
      decorations(state) {
        return grammarPluginKey.getState(state);
      },
    },
  });
}

export const GrammarDecorationExtension = Extension.create({
  name: 'grammarDecorations',

  addProseMirrorPlugins() {
    return [createGrammarPlugin()];
  },
});
