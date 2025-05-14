import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import Sidebar from '@/components/sidebar/Sidebar';
import Editor from '@/components/editor/Editor';
import { useDocument } from '@/hooks/use-document';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShareIcon, MoreHorizontal, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, formatDistanceToNow } from 'date-fns';

export default function Document() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute<{ id: string }>('/document/:id');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentCategory, setDocumentCategory] = useState('collection_bucket');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [lastAutoSaved, setLastAutoSaved] = useState<Date | null>(null);
  
  const {
    document,
    localContent,
    setLocalContent,
    saveDocument,
    isLoading,
    isError,
    createDocument,
    deleteDocument,
    isSaving,
    lastSaved
  } = useDocument(params?.id);

  // Update local state when document is loaded
  useEffect(() => {
    if (document) {
      setDocumentTitle(document.title);
      setDocumentCategory(document.category);
    }
  }, [document]);

  // Auto-save document every 10 seconds if there are changes
  useEffect(() => {
    if (!document || !localContent) return;
    
    const autoSaveInterval = setInterval(() => {
      if (document.title !== documentTitle || document.category !== documentCategory || 
          JSON.stringify(document.content) !== JSON.stringify(localContent)) {
        saveDocument(documentTitle, documentCategory);
        setLastAutoSaved(new Date());
      }
    }, 10000);
    
    return () => clearInterval(autoSaveInterval);
  }, [document, localContent, documentTitle, documentCategory]);

  const handleCreateDocument = async () => {
    if (!documentTitle.trim()) return;
    
    const newDoc = await createDocument({
      title: documentTitle,
      category: documentCategory,
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: documentTitle }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '' }]
          }
        ]
      }
    });
    
    setIsCreateDialogOpen(false);
    
    // Navigate to the new document
    if (newDoc?.id) {
      setLocation(`/document/${newDoc.id}`);
    }
  };

  const handleDeleteDocument = () => {
    if (!document) return;
    
    deleteDocument(document.id);
    setLocation('/');
  };

  const handleManualSave = () => {
    saveDocument(documentTitle, documentCategory);
  };

  if (isError) {
    return (
      <div className="flex h-full">
        <Sidebar onCreateSession={() => setIsCreateDialogOpen(true)} />
        <main className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <h2 className="text-2xl font-medium text-secondary mb-2">Error Loading Document</h2>
            <p className="text-muted-foreground mb-4">There was a problem loading this document</p>
            <Button onClick={() => setLocation('/')}>Go Home</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <Sidebar onCreateSession={() => setIsCreateDialogOpen(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Document Header */}
        <header className="border-b border-border flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : isEditingTitle ? (
              <Input
                className="text-2xl font-medium text-secondary w-64"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingTitle(false);
                    saveDocument(documentTitle, documentCategory);
                  }
                }}
                autoFocus
              />
            ) : (
              <h2 
                className="text-2xl font-medium text-secondary cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                onClick={() => setIsEditingTitle(true)}
              >
                {documentTitle}
              </h2>
            )}
            
            <div className="flex items-center text-gray-500 text-sm">
              <span>
                {document?.updatedAt ? (
                  `Last edited: ${formatDistanceToNow(new Date(document.updatedAt))} ago`
                ) : (
                  lastAutoSaved ? `Auto-saved ${formatDistanceToNow(lastAutoSaved)} ago` : ''
                )}
              </span>
              {lastSaved && <span className="ml-2">Manual save: {lastSaved}</span>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Select
              value={documentCategory}
              onValueChange={(value) => {
                setDocumentCategory(value);
                saveDocument(documentTitle, value);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="collection_bucket">Collection Bucket</SelectItem>
                <SelectItem value="next_actions">Next Actions</SelectItem>
                <SelectItem value="strategy_toolbox">Strategy Toolbox</SelectItem>
                <SelectItem value="database">Database</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center"
              onClick={handleManualSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            
            <Button variant="outline" size="sm" className="flex items-center">
              <ShareIcon className="h-4 w-4 mr-1" />
              Share
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Document</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this document? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteDocument} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>
        
        {/* Editor Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-6" />
              <Skeleton className="h-6 w-1/2 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <Editor 
              content={localContent} 
              onChange={setLocalContent} 
            />
          )}
        </div>
      </main>
      
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="title" className="text-right">
                Title
              </label>
              <Input
                id="title"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="category" className="text-right">
                Category
              </label>
              <Select
                value={documentCategory}
                onValueChange={setDocumentCategory}
              >
                <SelectTrigger id="category" className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collection_bucket">Collection Bucket</SelectItem>
                  <SelectItem value="next_actions">Next Actions</SelectItem>
                  <SelectItem value="strategy_toolbox">Strategy Toolbox</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateDocument}>Create Document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
