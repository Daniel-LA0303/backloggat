import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

type RichTextEditorProps = {
  label?: string;
  value: string; // HTML
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder = "Write something...",
  className = "",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // an empty editor returns "<p></p>": store "" instead
      onChange(editor.isEmpty ? "" : editor.getHTML());
    },
  });

  // sync when the parent swaps the value (e.g. the modal opens with another item)
  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (value !== current) editor.commands.setContent(value);
  }, [value, editor]);

  if (!editor) return null;

  const btn = (active: boolean) =>
    `rounded-md px-2 py-1 text-xs transition ${
      active
        ? "bg-[#8FD3AE]/15 text-[#8FD3AE]"
        : "text-[#A7B5AD] hover:bg-white/5 hover:text-[#F2F2F2]"
    }`;

  const tools = [
    { label: "B", title: "Bold", active: editor.isActive("bold"), run: () => editor.chain().focus().toggleBold().run() },
    { label: "I", title: "Italic", active: editor.isActive("italic"), run: () => editor.chain().focus().toggleItalic().run() },
    { label: "S", title: "Strikethrough", active: editor.isActive("strike"), run: () => editor.chain().focus().toggleStrike().run() },
    { label: "</>", title: "Inline code", active: editor.isActive("code"), run: () => editor.chain().focus().toggleCode().run() },
    { label: "H2", title: "Heading 2", active: editor.isActive("heading", { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "H3", title: "Heading 3", active: editor.isActive("heading", { level: 3 }), run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: "• List", title: "Bullet list", active: editor.isActive("bulletList"), run: () => editor.chain().focus().toggleBulletList().run() },
    { label: "1. List", title: "Numbered list", active: editor.isActive("orderedList"), run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: "❝", title: "Quote", active: editor.isActive("blockquote"), run: () => editor.chain().focus().toggleBlockquote().run() },
    { label: "{ }", title: "Code block", active: editor.isActive("codeBlock"), run: () => editor.chain().focus().toggleCodeBlock().run() },
  ];

  return (
    <div className={className}>
      {label && <p className="mb-1 text-sm text-[#A7B5AD]">{label}</p>}

      <div className="rounded-lg border border-white/10 bg-black/20 transition focus-within:border-[#8FD3AE]/50">
        <div className="flex flex-wrap gap-1 border-b border-white/10 p-1.5">
          {tools.map((t) => (
            <button
              key={t.title}
              type="button" // important: don't submit the form
              title={t.title}
              aria-pressed={t.active}
              onClick={t.run}
              className={btn(t.active)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <EditorContent editor={editor} className="rich-text max-h-72 overflow-y-auto px-3 py-2" />
      </div>
    </div>
  );
}

/**
 * 
to show it import DOMPurify from "dompurify";

<div
  className="rich-text"
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(knowledge.description) }}
/>
 */