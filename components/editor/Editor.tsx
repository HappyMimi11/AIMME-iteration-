import { useEditor, EditorContent } from '@tiptap/react';
import { extensions } from '@/lib/editor-extensions';
import MenuBar from './MenuBar';
import { useEffect } from 'react';

interface EditorProps {
  content: any;
  onChange: (content: any) => void;
  editable?: boolean;
}

export default function Editor({ content, onChange, editable = true }: EditorProps) {
  const editor = useEditor({
    extensions,
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  useEffect(() => {
    if (editor && content && editor.isEmpty) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  return (
    <div className="flex flex-col h-full">
      <MenuBar editor={editor} />
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} className="h-full p-4" />
      </div>
    </div>
  );
}
