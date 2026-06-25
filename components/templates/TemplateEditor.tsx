'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setTemplateBody } from '@/store/slices/templateSlice';
import { Bold, Italic, List, ListOrdered, Undo, Redo, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TemplateEditorProps {
  initialContent?: string;
  onVariablesChange?: (vars: string[]) => void;
}

const DEFAULT_VARIABLES = ['first_name', 'email', 'company_name', 'position', 'sender_name'];

export default function TemplateEditor({ initialContent = '', onVariablesChange }: TemplateEditorProps) {
  const dispatch = useDispatch();
  const body = useSelector((state: RootState) => state.template.body);
  const [customVar, setCustomVar] = useState('');
  const [variables, setVariables] = useState<string[]>(DEFAULT_VARIABLES);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent || body,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      dispatch(setTemplateBody(html));
    },
  });

  // Sync body from redux if loaded externally (like edit templates)
  useEffect(() => {
    if (editor && body && editor.getHTML() !== body) {
      editor.commands.setContent(body);
    }
  }, [body, editor]);

  if (!editor) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50/50 dark:border-gray-900 dark:bg-gray-950/50 animate-pulse">
        <span className="text-sm text-gray-400">Loading TipTap Editor...</span>
      </div>
    );
  }

  const insertVariable = (varName: string) => {
    editor.chain().focus().insertContent(`{{${varName}}}`).run();
  };

  const handleAddCustomVar = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = customVar.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    if (formatted && !variables.includes(formatted)) {
      setVariables([...variables, formatted]);
      setCustomVar('');
      if (onVariablesChange) {
        onVariablesChange([...variables, formatted]);
      }
    }
  };

  return (
    <div className="rounded-2xl border border-gray-150 bg-white shadow-sm overflow-hidden dark:border-gray-800 dark:bg-gray-950">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/50 px-4 py-2.5 dark:border-gray-900 dark:bg-gray-950/20">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800 ${
              editor.isActive('bold') ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' : 'text-gray-500'
            }`}
          >
            <Bold className="h-4.5 w-4.5" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800 ${
              editor.isActive('italic') ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' : 'text-gray-500'
            }`}
          >
            <Italic className="h-4.5 w-4.5" />
          </button>

          <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-800 mx-1" />

          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800 ${
              editor.isActive('bulletList') ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' : 'text-gray-500'
            }`}
          >
            <List className="h-4.5 w-4.5" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800 ${
              editor.isActive('orderedList') ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' : 'text-gray-500'
            }`}
          >
            <ListOrdered className="h-4.5 w-4.5" />
          </button>

          <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-800 mx-1" />

          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
          >
            <Undo className="h-4.5 w-4.5" />
          </button>

          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
          >
            <Redo className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Add custom variables */}
        <form onSubmit={handleAddCustomVar} className="flex items-center gap-1.5">
          <input
            type="text"
            placeholder="Custom variable..."
            value={customVar}
            onChange={(e) => setCustomVar(e.target.value)}
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs outline-none focus:border-indigo-500 dark:border-gray-800 dark:bg-gray-900"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

      {/* Editor Content Area */}
      <div className="p-4 min-h-[300px] prose prose-sm max-w-none dark:prose-invert focus:outline-none">
        <EditorContent editor={editor} className="outline-none min-h-[300px]" />
      </div>

      {/* Variables Toolbar */}
      <div className="border-t border-gray-100 bg-gray-50/20 p-4 dark:border-gray-900">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Insert Variable Chip (Click to insert at cursor)
        </h4>
        <div className="flex flex-wrap gap-2">
          {variables.map((v) => (
            <button
              key={v}
              onClick={() => insertVariable(v)}
              className="rounded-xl border border-indigo-100 bg-indigo-50/30 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 hover:shadow-sm active:scale-95 dark:border-indigo-950/40 dark:bg-indigo-950/10 dark:text-indigo-400"
            >
              {"{{"} {v} {"}}"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
