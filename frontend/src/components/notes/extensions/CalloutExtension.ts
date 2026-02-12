import { mergeAttributes, Node } from '@tiptap/core';

type CalloutType = 'info' | 'warning' | 'tip';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (calloutType?: CalloutType) => ReturnType;
    };
  }
}

const typeClassMap: Record<CalloutType, string> = {
  info: 'border-blue-300 bg-blue-50 text-blue-900',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  tip: 'border-emerald-300 bg-emerald-50 text-emerald-900',
};

export const CalloutExtension = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return {
      calloutType: {
        default: 'info',
        parseHTML: (element) => element.getAttribute('data-callout-type') || 'info',
        renderHTML: (attributes) => ({ 'data-callout-type': attributes.calloutType }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const calloutType = (HTMLAttributes.calloutType as CalloutType) || 'info';
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'callout',
        class: `rounded-lg border px-3 py-2 ${typeClassMap[calloutType]}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCallout:
        (calloutType: CalloutType = 'info') =>
        ({ chain }) =>
          chain()
            .insertContent({
              type: this.name,
              attrs: { calloutType },
              content: [{ type: 'text', text: 'Callout text...' }],
            })
            .run(),
    };
  },
});

export type { CalloutType };
