import { InsertDocument } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

/**
 * Utility function to create a document for a category if it doesn't exist
 * @param categoryPath The path segment used in the URL (e.g., 'actionables/projects')
 * @param title The document title
 * @param description Optional description to include in the document content
 * @param userId The user ID who owns the document
 * @param existingDocuments List of existing documents to check against
 * @returns Promise that resolves when the document is created (or already exists)
 */
export async function createCategoryDocumentIfNotExists(
  categoryPath: string,
  title: string,
  description: string = '',
  userId: number,
  existingDocuments: any[] = []
): Promise<void> {
  // Check if the document already exists for this category
  const existingDoc = existingDocuments.find(doc => doc.category === categoryPath);
  
  if (!existingDoc) {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: title }]
        },
        ...(description ? [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: description }]
          }
        ] : []),
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Content for this page will appear here.' }]
        }
      ]
    };
    
    const newDocument: InsertDocument = {
      title,
      content,
      category: categoryPath,
      userId
    };
    
    console.log(`Creating new document for category ${categoryPath}:`, newDocument);
    
    // Create the document via direct API call
    await apiRequest('POST', '/api/documents', newDocument);
  }
}