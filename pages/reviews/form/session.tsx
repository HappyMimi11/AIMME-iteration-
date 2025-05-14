import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useReview } from '@/hooks/use-review';
import { useSession } from '@/hooks/use-session';
import { useToast } from '@/hooks/use-toast';
import { Session } from '@shared/schema';
import { Review } from '@/components/reviews/ReviewList';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Sidebar from '@/components/sidebar/Sidebar';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function SessionReflectionForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    goalsAchieved: '',
    metastrategicReflection: '',
    extrapolate: '',
  });
  
  // State to track if we're editing an existing reflection
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

  const [location, setLocation] = useLocation();
  
  // Match both the regular form route and the edit route
  const [matchRegular, paramsRegular] = useRoute('/reviews/form/session/:id');
  const [matchEdit, paramsEdit] = useRoute('/reviews/form/session/:sessionId/edit/:reviewId');
  
  // Check which route matched and extract parameters
  const sessionId = matchEdit && paramsEdit?.sessionId 
    ? parseInt(paramsEdit.sessionId, 10) 
    : (matchRegular && paramsRegular?.id ? parseInt(paramsRegular.id, 10) : undefined);
  
  const reviewId = matchEdit && paramsEdit?.reviewId 
    ? parseInt(paramsEdit.reviewId, 10) 
    : null;
  
  console.log("Route match - Regular:", matchRegular, "Edit:", matchEdit);
  console.log("Params - Regular:", paramsRegular, "Edit:", paramsEdit);
  console.log("Extracted - Session ID:", sessionId, "Review ID:", reviewId);
  
  const { 
    addReview, 
    updateReview,
    getReviewById,
    parseReviewContent,
    reviews, // Get all reviews directly
    isLoading: isSaving 
  } = useReview();
  
  const { session, updateSessionMutation } = useSession(sessionId);
  
  // Load existing review data if we're in edit mode
  useEffect(() => {
    console.log("Reviews useEffect running, reviewId:", reviewId);
    console.log("All available reviews:", reviews);
    
    if (reviewId) {
      setEditingReviewId(reviewId);
      
      // Get the existing review and populate the form
      const existingReview = getReviewById(reviewId);
      console.log("Editing existing review:", existingReview, "ID:", reviewId);
      
      // If no review found but we have the ID, do an extra check across all reviews
      if (!existingReview) {
        console.log("Review not found by ID, attempting to find by ID in all reviews");
        const manualFind = reviews.find(r => Number(r.id) === Number(reviewId));
        console.log("Manual find result:", manualFind);
        if (manualFind) {
          // Parse the preview content to get the form fields
          const parsedContent = parseReviewContent(manualFind.preview);
          setFormData({
            goalsAchieved: parsedContent.goalsAchieved,
            metastrategicReflection: parsedContent.metastrategicReflection,
            extrapolate: parsedContent.extrapolate
          });
          return;
        }
      }
      
      if (existingReview) {
        // Parse the preview content to get the form fields
        const parsedContent = parseReviewContent(existingReview.preview);
        console.log("Parsed content:", parsedContent);
        setFormData({
          goalsAchieved: parsedContent.goalsAchieved,
          metastrategicReflection: parsedContent.metastrategicReflection,
          extrapolate: parsedContent.extrapolate
        });
      }
    }
  }, [location, getReviewById, parseReviewContent, reviews, editingReviewId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create a preview from the form data
      const preview = `Goals Achieved: ${formData.goalsAchieved.slice(0, 50)}${formData.goalsAchieved.length > 50 ? '...' : ''}
      
      Metastrategic Reflection: ${formData.metastrategicReflection.slice(0, 50)}${formData.metastrategicReflection.length > 50 ? '...' : ''}
      
      Extrapolate: ${formData.extrapolate.slice(0, 50)}${formData.extrapolate.length > 50 ? '...' : ''}`;
      
      // Save review using the context
      // Log for debugging
      console.log("Adding review with session ID:", session?.id);
      
      // Get the session ID from either the session object or the URL parameter
      const sessionIdValue = session?.id || sessionId;
      console.log("Session ID for reflection:", sessionIdValue);
      
      // Create a title that includes the session ID to make the connection explicit
      const sessionIdTag = sessionIdValue ? `[Session#${sessionIdValue}] ` : '';
      const sessionTitle = session?.title || new Date().toLocaleDateString();
      
      const reviewData: Omit<Review, "id" | "createdAt" | "updatedAt"> = {
        title: `${sessionIdTag}Work Session Reflection - ${sessionTitle}`,
        preview,
        type: 'session',
        // Store the session ID as a data attribute to make filtering more reliable
        sessionId: sessionIdValue,
      };
      
      console.log("Review data to save:", reviewData);
      
      let savedReview;
      
      // If we're editing an existing review, update it, otherwise create a new one
      if (editingReviewId) {
        console.log(`Updating existing review ${editingReviewId}`);
        savedReview = await updateReview(editingReviewId, reviewData);
        console.log("Updated review:", savedReview);
        
        toast({
          title: "Review updated",
          description: "Your reflection has been updated successfully."
        });
      } else {
        // Creating a new review
        savedReview = await addReview(reviewData);
        console.log("Created new review:", savedReview);
        
        toast({
          title: "Reflection added",
          description: "Your reflection has been saved successfully."
        });
      }
      
      // Mark the session as completed
      if (session && !session.isCompleted && sessionId) {
        try {
          // Create update data with both isCompleted and completedAt  
          const now = new Date().toISOString();
          const updateData = {
            isCompleted: true,
            completedAt: now
          };
          
          console.log("Updating session with data:", updateData);
          
          // Manually update the query cache for immediate UI update
          const sessionsQueryKey = ["/api/sessions"];
          
          // Force purge all session data from cache
          queryClient.removeQueries({ queryKey: sessionsQueryKey });
          
          // Force a refetch after a small delay
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: sessionsQueryKey });
          }, 100);
          
          // Clear individual session cache
          const sessionQueryKey = ["/api/sessions", sessionId];
          queryClient.removeQueries({ queryKey: sessionQueryKey });
          
          // Force a refetch of the individual session
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: sessionQueryKey });
          }, 100);
          
          // Make a direct fetch call to update the session status
          try {
            const response = await fetch(`/api/sessions/${sessionId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updateData)
            });
            
            const result = await response.json();
            console.log("Session update result:", result);
            
            // Invalidate queries to refresh data from server
            queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
            queryClient.refetchQueries({ queryKey: sessionsQueryKey });
          } catch (updateError) {
            console.error("Session update error:", updateError);
            // Continue anyway since we already updated the UI and saved the review
          }
        } catch (error) {
          console.error("Error updating session:", error);
          toast({
            title: "Error completing session",
            description: "There was an error marking the session as completed. Your reflection was saved.",
            variant: "destructive"
          });
        }
      }
      
      // We've already shown specific toasts for create/update above,
      // only show a general success toast if we're not editing
      if (!editingReviewId) {
        toast({
          title: "Reflection saved",
          description: "Your session reflection has been saved and the session marked as complete.",
        });
      }
      
      // Before redirecting, ensure we clear all session caches
      queryClient.removeQueries({ queryKey: ["/api/sessions"] });
      
      // Redirect with a small delay to ensure toast displays and server has time to process
      setTimeout(() => {
        if (editingReviewId && session) {
          // If we were editing, go back to the session detail view
          setLocation(`/sessions?session=${session.id}`);
        } else {
          // Otherwise redirect back to sessions page
          setLocation('/sessions');
        }
      }, 1000);
    } catch (error) {
      console.error('Error saving review:', error);
    }
  };

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#F8FAFC] p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">
            {editingReviewId ? 'Edit Work Session Reflection' : 'Work Session Reflection'}
          </h1>
          <p className="text-gray-600 mb-6">
            {editingReviewId 
              ? 'Update your insights and learnings from this session' 
              : 'Take time to reflect on what you learned from this session'
            }
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  <div className="flex items-center gap-2">
                    <span>Did you achieve your goals?</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Think about:</p>
                          <ul className="list-disc pl-4 mt-1">
                            <li>What specific goals did you accomplish?</li>
                            <li>What progress did you make?</li>
                            <li>What unexpected wins did you have?</li>
                            <li>What did you learn?</li>
                            <li>What are you proud of?</li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardTitle>
                <CardDescription>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea 
                    name="goalsAchieved"
                    value={formData.goalsAchieved}
                    onChange={handleInputChange}
                    placeholder="Reflect on the goals you achieved in this session..."
                    className="min-h-[150px]"
                    required
                  />
                </div>

                <div className="space-y-2 pt-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <span>Metastrategic Reflection</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Consider:</p>
                          <ul className="list-disc pl-4 mt-1">
                            <li>Which approaches worked particularly well?</li>
                            <li>What helped you stay focused?</li>
                            <li>How did you overcome obstacles?</li>
                            <li>What tools or techniques were most useful?</li>
                            <li>What would you do again?</li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Textarea 
                    name="metastrategicReflection"
                    value={formData.metastrategicReflection}
                    onChange={handleInputChange}
                    placeholder="Reflect on the strategies that worked well..."
                    className="min-h-[150px]"
                    required
                  />
                </div>

                <div className="space-y-2 pt-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <span>Extrapolate</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Reflect on:</p>
                          <ul className="list-disc pl-4 mt-1">
                            <li>What could have gone better?</li>
                            <li>What obstacles did you face?</li>
                            <li>What would you do differently?</li>
                            <li>What help or resources do you need?</li>
                            <li>How can you prepare better next time?</li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Textarea 
                    name="extrapolate"
                    value={formData.extrapolate}
                    onChange={handleInputChange}
                    placeholder="Reflect on areas for improvement..."
                    className="min-h-[150px]"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" type="button" onClick={() => setLocation('/sessions')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : (editingReviewId ? 'Update Reflection' : 'Save Reflection')}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </main>
    </div>
  );
}