import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

interface MenuBarProps {
  editor: Editor | null;
}

export default function MenuBar({ editor }: MenuBarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-border p-2 flex flex-wrap items-center gap-1">
      <div className="flex items-center border-r border-border pr-2 mr-1">
        <Toggle
          size="sm"
          pressed={editor.isActive('undo')}
          onPressedChange={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          aria-label="Undo"
          variant="outline"
        >
          <Undo className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('redo')}
          onPressedChange={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          aria-label="Redo"
          variant="outline"
        >
          <Redo className="h-4 w-4" />
        </Toggle>
      </div>

      <Select 
        onValueChange={(value) => {
          if (value === 'paragraph') {
            editor.chain().focus().setParagraph().run();
          } else if (value === 'heading1') {
            editor.chain().focus().toggleHeading({ level: 1 }).run();
          } else if (value === 'heading2') {
            editor.chain().focus().toggleHeading({ level: 2 }).run();
          } else if (value === 'heading3') {
            editor.chain().focus().toggleHeading({ level: 3 }).run();
          }
        }}
        value={
          editor.isActive('heading', { level: 1 })
            ? 'heading1'
            : editor.isActive('heading', { level: 2 })
            ? 'heading2'
            : editor.isActive('heading', { level: 3 })
            ? 'heading3'
            : 'paragraph'
        }
      >
        <SelectTrigger className="h-8 w-[110px]">
          <SelectValue placeholder="Style" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">Normal</SelectItem>
          <SelectItem value="heading1">Heading 1</SelectItem>
          <SelectItem value="heading2">Heading 2</SelectItem>
          <SelectItem value="heading3">Heading 3</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
        variant="outline"
        className={cn(editor.isActive('bold') && "bg-blue-50 text-accent")}
      >
        <Bold className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
        variant="outline"
        className={cn(editor.isActive('italic') && "bg-blue-50 text-accent")}
      >
        <Italic className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive('underline')}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        aria-label="Underline"
        variant="outline"
        className={cn(editor.isActive('underline') && "bg-blue-50 text-accent")}
      >
        <Underline className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        aria-label="Strike"
        variant="outline"
        className={cn(editor.isActive('strike') && "bg-blue-50 text-accent")}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive('highlight')}
        onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
        aria-label="Highlight"
        variant="outline"
        className={cn(editor.isActive('highlight') && "bg-blue-50 text-accent")}
      >
        <Highlighter className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Bullet List"
        variant="outline"
        className={cn(editor.isActive('bulletList') && "bg-blue-50 text-accent")}
      >
        <List className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Ordered List"
        variant="outline"
        className={cn(editor.isActive('orderedList') && "bg-blue-50 text-accent")}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive('taskList')}
        onPressedChange={() => editor.chain().focus().toggleTaskList().run()}
        aria-label="Task List"
        variant="outline"
        className={cn(editor.isActive('taskList') && "bg-blue-50 text-accent")}
      >
        <CheckSquare className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        pressed={editor.isActive('link')}
        onPressedChange={() => {
          const previousUrl = editor.getAttributes('link').href ?? '';
          const url = window.prompt('URL', previousUrl);
          
          if (url === null) {
            return;
          }
          
          if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
          }
          
          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }}
        aria-label="Link"
        variant="outline"
        className={cn(editor.isActive('link') && "bg-blue-50 text-accent")}
      >
        <Link className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'left' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
        aria-label="Align Left"
        variant="outline"
        className={cn(editor.isActive({ textAlign: 'left' }) && "bg-blue-50 text-accent")}
      >
        <AlignLeft className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'center' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
        aria-label="Align Center"
        variant="outline"
        className={cn(editor.isActive({ textAlign: 'center' }) && "bg-blue-50 text-accent")}
      >
        <AlignCenter className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'right' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
        aria-label="Align Right"
        variant="outline"
        className={cn(editor.isActive({ textAlign: 'right' }) && "bg-blue-50 text-accent")}
      >
        <AlignRight className="h-4 w-4" />
      </Toggle>
    </div>
  );
}
