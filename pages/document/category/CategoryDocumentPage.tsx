import { useEffect } from 'react';
import { useParams } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useDocuments } from '@/hooks/use-document';
import Editor from '@/components/editor/Editor';
import { createCategoryDocumentIfNotExists } from '../utils/create-category-document';
import { Loader2 } from 'lucide-react';

interface CategoryDocumentPageProps {
  categoryPath?: string;  // Override for category path if not using URL params
  title: string;
  description?: string;
}

export default function CategoryDocumentPage({ 
  categoryPath, 
  title, 
  description 
}: CategoryDocumentPageProps) {
  const params = useParams();
  // Use provided categoryPath or get it from URL params
  const category = categoryPath || params.category;
  
  const { user } = useAuth();
  const { documents, isLoading } = useDocuments(category);
  
  useEffect(() => {
    // Create the document if it doesn't exist
    if (user && category) {
      createCategoryDocumentIfNotExists(category, title, description || '', user.id, documents);
    }
  }, [user, category, title, description, documents]);
  
  // Find the document for this category or use the first one
  const document = documents.find(doc => doc.category === category) || documents[0];
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  return (
    <div className="h-full w-full">
      {document ? (
        <Editor 
          content={document.content} 
          onChange={(newContent) => {
            console.log('Document content updated:', newContent);
            // In a real implementation, we would save this content
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-xl font-semibold">No document found for this category</h2>
          <p className="text-muted-foreground">
            Please refresh the page or contact support if this issue persists.
          </p>
        </div>
      )}
    </div>
  );
}