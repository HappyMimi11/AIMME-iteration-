import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  List,
  ListOrdered,
  CheckSquare,
  Link,
  Edit,
  Plus,
  AlignLeft,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ToolbarProps {
  editor: Editor | null;
}

export default function Toolbar({ editor }: ToolbarProps) {
  if (!editor) {
    return null;
  }

  const toggleLink = () => {
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
  };

  return (
    <div className="border-b border-border p-2 flex flex-wrap items-center gap-1">
      {/* Text Formatting */}
      <div className="flex items-center border-r border-border pr-2 mr-1">
        <Button
          variant="ghost"
          size="sm"
          className={cn("p-1 rounded-md hover:bg-gray-100 text-secondary", 
            editor.isActive('edit') && "bg-blue-50 text-accent")}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Edit className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("p-1 rounded-md hover:bg-gray-100 text-secondary", 
            editor.isActive('plus') && "bg-blue-50 text-accent")}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Plus className="h-5 w-5" />
        </Button>
        <span className="toolbar-divider">|</span>
        <Button
          variant="ghost"
          size="sm"
          className={cn("p-1 rounded-md hover:bg-gray-100 text-secondary",
            editor.isActive({ textAlign: 'left' }) && "bg-blue-50 text-accent")}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft className="h-5 w-5" />
        </Button>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        className={cn("p-1 rounded-md hover:bg-gray-100 text-secondary", 
          editor.isActive('link') && "bg-blue-50 text-accent")}
        onClick={toggleLink}
      >
        <Link className="h-5 w-5" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className={cn("p-1 rounded-md hover:bg-gray-100 text-secondary", 
          editor.isActive('bold') && "bg-blue-50 text-accent")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Bold</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className={cn("p-1 rounded-md hover:bg-gray-100 text-secondary", 
          editor.isActive('italic') && "bg-blue-50 text-accent")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Italic</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className={cn("p-1 rounded-md hover:bg-gray-100 text-secondary", 
          editor.isActive('underline') && "bg-blue-50 text-accent")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Underline</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className={cn("p-1 rounded-md hover:bg-gray-100 text-secondary", 
          editor.isActive('highlight') && "bg-blue-50 text-accent")}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <Highlighter className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Highlight</span>
      </Button>
      
      <span className="toolbar-divider">|</span>
      
      {/* Lists */}
      <Button
        variant="ghost"
        size="sm"
        className={cn("p-1 rounded-md hover:bg-gray-100 text-secondary", 
          editor.isActive('bulletList') && "bg-blue-50 text-accent")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Bullet List</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className={cn("p-1 rounded-md hover:bg-gray-100 text-secondary", 
          editor.isActive('orderedList') && "bg-blue-50 text-accent")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Numbered List</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className={cn("p-1 rounded-md hover:bg-gray-100 text-secondary", 
          editor.isActive('taskList') && "bg-blue-50 text-accent")}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <CheckSquare className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Checklist</span>
      </Button>
      
      <span className="toolbar-divider">|</span>
      
      {/* Font Size */}
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
          } else if (value === 'small') {
            editor.chain().focus().setParagraph().run()
              .chain().focus().setFontSize('0.875em').run();
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
        <SelectTrigger className="w-[110px] text-sm h-8">
          <SelectValue placeholder="Text style" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">Normal</SelectItem>
          <SelectItem value="heading1">Heading 1</SelectItem>
          <SelectItem value="heading2">Heading 2</SelectItem>
          <SelectItem value="heading3">Heading 3</SelectItem>
          <SelectItem value="small">Small</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
