import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Document, UpdateDocument, InsertDocument } from '@shared/schema';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export function useDocument(id?: string) {
  const { toast } = useToast();
  const [localContent, setLocalContent] = useState<any>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Query to get document
  const documentQuery = useQuery<Document>({
    queryKey: id ? [`/api/documents/${id}`] : null,
    enabled: !!id,
  });

  // Set local content when document loads
  useEffect(() => {
    if (documentQuery.data?.content) {
      setLocalContent(documentQuery.data.content);
    }
  }, [documentQuery.data]);

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, document }: { id: number, document: UpdateDocument }) => {
      const res = await apiRequest('PUT', `/api/documents/${id}`, document);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/category/${data.category}`] });
      
      const now = new Date();
      setLastSaved(format(now, 'h:mm a'));
      
      toast({
        title: "Document saved",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to save",
        description: "There was an error saving your document. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (document: InsertDocument) => {
      const res = await apiRequest('POST', '/api/documents', document);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/category/${data.category}`] });
      
      const now = new Date();
      setLastSaved(format(now, 'h:mm a'));
      
      toast({
        title: "Document created",
        description: "Your new document has been created successfully.",
      });
      
      return data;
    },
    onError: () => {
      toast({
        title: "Failed to create document",
        description: "There was an error creating your document. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await apiRequest('DELETE', `/api/documents/${documentId}`);
      return documentId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      if (documentQuery.data?.category) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/documents/category/${documentQuery.data.category}`] 
        });
      }
      
      toast({
        title: "Document deleted",
        description: "The document has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete",
        description: "There was an error deleting the document. Please try again.",
        variant: "destructive",
      });
    }
  });

  const saveDocument = (title: string, category: string) => {
    if (!localContent) return;
    
    if (id && documentQuery.data) {
      updateDocumentMutation.mutate({
        id: parseInt(id),
        document: {
          title,
          category,
          content: localContent
        }
      });
    }
  };

  const createDocument = async (document: InsertDocument) => {
    return createDocumentMutation.mutateAsync(document);
  };

  const deleteDocument = (documentId: number) => {
    deleteDocumentMutation.mutate(documentId);
  };

  return {
    document: documentQuery.data,
    isLoading: documentQuery.isLoading,
    isError: documentQuery.isError,
    localContent,
    setLocalContent,
    saveDocument,
    createDocument,
    deleteDocument,
    isSaving: updateDocumentMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending,
    lastSaved,
  };
}

export function useDocuments(category?: string) {
  // Query to get all documents
  const documentsQuery = useQuery<Document[]>({
    queryKey: category ? [`/api/documents/category/${category}`] : ['/api/documents'],
  });

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    isError: documentsQuery.isError,
  };
}
