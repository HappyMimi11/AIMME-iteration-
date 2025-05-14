import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Review } from "@/components/reviews/ReviewList";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface ReviewContextType {
  reviews: Review[];
  isLoading: boolean;
  error: Error | null;
  addReview: (review: Omit<Review, "id" | "createdAt" | "updatedAt">) => Promise<Review>;
  updateReview: (id: number, review: Partial<Review>) => Promise<Review>;
  deleteReview: (id: number) => Promise<void>;
  getReviewsByType: (type: string) => Review[];
  getReviewsBySessionId: (sessionId: number) => Review[];
  getReviewById: (id: number) => Review | undefined;
  // Parse review content from preview text
  parseReviewContent: (preview: string) => { 
    goalsAchieved: string; 
    metastrategicReflection: string; 
    extrapolate: string; 
  };
}

export const ReviewContext = createContext<ReviewContextType | null>(null);

export function ReviewProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load reviews from localStorage on initial load
  useEffect(() => {
    if (user) {
      try {
        const savedReviews = localStorage.getItem(`reviews_${user.id}`);
        if (savedReviews) {
          // Parse dates properly
          const parsed = JSON.parse(savedReviews, (key, value) => {
            if (key === 'createdAt' || key === 'updatedAt') {
              return new Date(value);
            }
            return value;
          });
          setReviews(parsed);
        }
      } catch (err) {
        console.error('Error loading reviews from localStorage:', err);
      }
    }
  }, [user]);

  // Save reviews to localStorage whenever they change
  useEffect(() => {
    if (user && reviews.length > 0) {
      localStorage.setItem(`reviews_${user.id}`, JSON.stringify(reviews));
    }
  }, [reviews, user]);

  const getReviewsByType = (type: string): Review[] => {
    return reviews.filter(review => review.type === type);
  };
  
  const getReviewsBySessionId = (sessionId: number): Review[] => {
    console.log(`Checking for reviews with sessionId ${sessionId}`); 
    
    // Debug all session reviews more clearly
    const allSessionReviews = reviews.filter(review => review.type === 'session');
    console.log("All session review IDs and sessionIds:", 
      allSessionReviews.map(r => ({ 
        id: r.id, 
        sessionId: typeof r.sessionId === 'undefined' ? 'undefined' : r.sessionId, 
        title: r.title 
      }))
    );
    
    // First, check by direct sessionId match
    const byExactId = allSessionReviews.filter(review => {
      const reviewSessionId = Number(review.sessionId);
      const targetId = Number(sessionId);
      const matches = reviewSessionId === targetId;
      console.log(`Review ${review.id} sessionId (${reviewSessionId}) matches target (${targetId})? ${matches}`);
      return matches;
    });
    
    if (byExactId.length > 0) {
      console.log("Found reviews by exact sessionId match:", byExactId.length);
      return byExactId;
    }
    
    // Also look for the session ID in the title as a backup
    return allSessionReviews.filter(review => 
      review.title.includes(`[Session#${sessionId}]`)
    );
  };
  
  const getReviewById = (id: number): Review | undefined => {
    console.log(`Looking for review with ID: ${id}`);
    console.log(`Available reviews:`, reviews.map(r => ({ id: r.id, title: r.title })));
    
    // Ensure we're comparing numbers, not strings
    const numericId = Number(id);
    const found = reviews.find(review => Number(review.id) === numericId);
    
    console.log(`Review ${numericId} found:`, found);
    return found;
  };

  const addReview = async (reviewData: Omit<Review, "id" | "createdAt" | "updatedAt">): Promise<Review> => {
    try {
      console.log("In addReview with data:", reviewData);
      
      // If there's a sessionId, ensure it's a number
      const sessionId = reviewData.sessionId ? Number(reviewData.sessionId) : undefined;
      console.log("Normalized sessionId:", sessionId);
      
      setIsLoading(true);
      // Generate a new review with appropriate timestamps
      const newReview: Review = {
        ...reviewData,
        id: Date.now(), // Use timestamp as ID for now
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionId // Use the normalized sessionId
      };
      
      console.log("Created new review object:", newReview);
      
      // Add to state
      setReviews(prevReviews => [...prevReviews, newReview]);
      
      toast({
        title: "Review created",
        description: "Your review has been saved successfully.",
      });
      
      return newReview;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create review');
      setError(error);
      toast({
        title: "Error creating review",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateReview = async (id: number, reviewData: Partial<Review>): Promise<Review> => {
    try {
      setIsLoading(true);
      
      // Find and update the review
      const updatedReviews = reviews.map(review => 
        review.id === id 
          ? { ...review, ...reviewData, updatedAt: new Date() } 
          : review
      );
      
      const updatedReview = updatedReviews.find(review => review.id === id);
      
      if (!updatedReview) {
        throw new Error(`Review with ID ${id} not found`);
      }
      
      setReviews(updatedReviews);
      
      toast({
        title: "Review updated",
        description: "Your review has been updated successfully.",
      });
      
      return updatedReview;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update review');
      setError(error);
      toast({
        title: "Error updating review",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReview = async (id: number): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Filter out the review to delete
      const filteredReviews = reviews.filter(review => review.id !== id);
      
      if (filteredReviews.length === reviews.length) {
        throw new Error(`Review with ID ${id} not found`);
      }
      
      setReviews(filteredReviews);
      
      toast({
        title: "Review deleted",
        description: "Your review has been deleted successfully.",
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete review');
      setError(error);
      toast({
        title: "Error deleting review",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to parse review content from preview text
  const parseReviewContent = (preview: string) => {
    // Parse the preview text to extract the different sections
    const sections: { 
      goalsAchieved: string; 
      metastrategicReflection: string; 
      extrapolate: string; 
      [key: string]: string; // Add index signature
    } = {
      goalsAchieved: '',
      metastrategicReflection: '',
      extrapolate: ''
    };
    
    console.log("Parsing preview content:", preview);
    
    // Split the text by sections for more reliable parsing
    const lines = preview.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('Goals Achieved:')) {
        currentSection = 'goalsAchieved';
        // Extract content after the colon
        const content = trimmedLine.substring('Goals Achieved:'.length).trim();
        if (content) sections.goalsAchieved = content;
      } 
      else if (trimmedLine.startsWith('Metastrategic Reflection:')) {
        currentSection = 'metastrategicReflection';
        // Extract content after the colon
        const content = trimmedLine.substring('Metastrategic Reflection:'.length).trim();
        if (content) sections.metastrategicReflection = content;
      }
      else if (trimmedLine.startsWith('Extrapolate:')) {
        currentSection = 'extrapolate';
        // Extract content after the colon
        const content = trimmedLine.substring('Extrapolate:'.length).trim();
        if (content) sections.extrapolate = content;
      }
      // If the line is not empty and not a section header, add it to the current section
      else if (trimmedLine && currentSection) {
        sections[currentSection] += ' ' + trimmedLine;
      }
    }
    
    // Also try regex as a fallback
    if (!sections.goalsAchieved) {
      const goalsMatch = preview.match(/Goals Achieved:\s*([\s\S]*?)(?=\s*Metastrategic Reflection:|$)/);
      if (goalsMatch && goalsMatch[1]) sections.goalsAchieved = goalsMatch[1].trim();
    }
    
    if (!sections.metastrategicReflection) {
      const metaMatch = preview.match(/Metastrategic Reflection:\s*([\s\S]*?)(?=\s*Extrapolate:|$)/);
      if (metaMatch && metaMatch[1]) sections.metastrategicReflection = metaMatch[1].trim();
    }
    
    if (!sections.extrapolate) {
      const extrapolateMatch = preview.match(/Extrapolate:\s*([\s\S]*?)$/);
      if (extrapolateMatch && extrapolateMatch[1]) sections.extrapolate = extrapolateMatch[1].trim();
    }
    
    console.log("Parsed review content:", sections);
    return sections;
  };

  return (
    <ReviewContext.Provider
      value={{
        reviews,
        isLoading,
        error,
        addReview,
        updateReview,
        deleteReview,
        getReviewsByType,
        getReviewsBySessionId,
        getReviewById,
        parseReviewContent
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
}

export function useReview() {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error("useReview must be used within a ReviewProvider");
  }
  return context;
}