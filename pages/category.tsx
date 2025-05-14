import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import Sidebar from '@/components/sidebar/Sidebar';
import Editor from '@/components/editor/Editor';
import { useDocuments, useDocument } from '@/hooks/use-document';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Save } from 'lucide-react';

export default function CategoryPage() {
  const [_, setLocation] = useLocation();
  const [match, params] = useRoute<{ category: string }>('/document/category/:category');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentCategory, setDocumentCategory] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  
  const { documents, isLoading: isLoadingDocuments } = useDocuments(params?.category);
  const {
    document,
    localContent,
    setLocalContent,
    saveDocument,
    createDocument,
    isLoading,
    isSaving,
    lastSaved
  } = useDocument(documents?.[0]?.id?.toString());

  // Update local state when category changes
  useEffect(() => {
    if (params?.category) {
      setDocumentCategory(params.category);
    }
  }, [params?.category]);

  // Update local state when document is loaded
  useEffect(() => {
    if (document) {
      setDocumentTitle(document.title);
    }
  }, [document]);

  const handleManualSave = () => {
    if (document) {
      saveDocument(documentTitle, documentCategory);
    }
  };

  const handleCreateDocument = async () => {
    // Create a new document for the category if none exists
    if (!documents || documents.length === 0) {
      const categoryTitle = params?.category
        ? params.category
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        : 'New Document';
      
      const newDoc = await createDocument({
        title: categoryTitle,
        category: params?.category || 'default',
        content: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: "text", text: categoryTitle }]
            },
            {
              type: 'paragraph',
              content: [{ type: "text", text: "Start writing here..." }]
            }
          ]
        }
      });
      
      if (newDoc?.id) {
        setLocation(`/document/${newDoc.id}`);
      }
    }
  };

  // Create a document for the category if none exists
  useEffect(() => {
    if (!isLoadingDocuments && (!documents || documents.length === 0) && params?.category) {
      handleCreateDocument();
    }
  }, [isLoadingDocuments, documents, params?.category]);

  if (isLoading || isLoadingDocuments) {
    return (
      <div className="flex h-full">
        <Sidebar onCreateSession={() => setIsCreateDialogOpen(true)} />
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          <header className="border-b border-border flex items-center justify-between p-4">
            <Skeleton className="h-8 w-48" />
          </header>
          <div className="flex-1 overflow-auto p-6">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-6" />
          </div>
        </main>
      </div>
    );
  }

  // Handle case when no document exists for this category
  if (!document) {
    return (
      <div className="flex h-full">
        <Sidebar onCreateSession={() => setIsCreateDialogOpen(true)} />
        <main className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center p-6">
            <h2 className="text-2xl font-medium text-secondary mb-2">No document found for this category</h2>
            <p className="text-muted-foreground mb-4">Do you want to create one now?</p>
            <Button onClick={handleCreateDocument}>Create Document</Button>
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
            {isEditingTitle ? (
              <Input
                className="text-2xl font-medium text-secondary w-64"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                onBlur={() => {
                  setIsEditingTitle(false);
                  saveDocument(documentTitle, documentCategory);
                }}
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
            
            {lastSaved && <span className="text-gray-500 text-sm">Last saved: {lastSaved}</span>}
          </div>
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
        </header>
        
        {/* Editor Content */}
        <div className="flex-1 overflow-auto">
          <Editor 
            content={localContent} 
            onChange={setLocalContent} 
          />
        </div>
      </main>
    </div>
  );
}