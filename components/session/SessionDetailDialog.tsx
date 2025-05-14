import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { HelpCircle, Clock, Check, Edit, FileText, Trash2 } from 'lucide-react';
import { Session, UpdateSession } from '@shared/schema';
import { format } from 'date-fns';
import { useSessions } from '@/hooks/use-session';
import { useReview } from '@/hooks/use-review';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Review } from '@/components/reviews/ReviewList';

interface SessionDetailDialogProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SessionDetailDialog({ session, isOpen, onClose }: SessionDetailDialogProps) {
  const { updateSessionMutation, deleteSessionMutation } = useSessions();
  const { reviews, getReviewsByType, getReviewsBySessionId, deleteReview } = useReview();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [, setLocation] = useLocation();
  const [sessionData, setSessionData] = useState<UpdateSession | null>(null);
  
  // Get session-related reflection reviews
  console.log("Session in detail dialog:", session);
  
  // Log all available reviews
  const allSessionReviews = getReviewsByType('session');
  console.log("All session reviews:", allSessionReviews);
  
  // Multiple methods to find session reflections
  const sessionReflections = session 
    ? (() => {
        // Try to find reviews with sessionId matching this session
        const byId = reviews.filter(review => 
          review.type === 'session' && Number(review.sessionId) === Number(session.id)
        );
        console.log(`Reviews by direct sessionId match (${session.id}):`, byId);
        
        if (byId.length > 0) return byId;
        
        // Try to find by session ID in the title
        const byIdInTitle = reviews.filter(review => 
          review.type === 'session' && review.title.includes(`[Session#${session.id}]`)
        );
        console.log(`Reviews by sessionId in title (${session.id}):`, byIdInTitle);
        
        if (byIdInTitle.length > 0) return byIdInTitle;
        
        // Fall back to matching by session title
        const byTitle = reviews.filter(review => 
          review.type === 'session' && (
            review.title.includes(session.title) || 
            review.title.includes(`Session Reflection - ${session.title}`) ||
            review.title.includes(`Work Session Reflection - ${session.title}`)
          )
        );
        console.log("Reviews by title match:", byTitle);
        
        return byTitle;
      })()
    : [];
  
  // Initialize the form data when the session changes
  useEffect(() => {
    if (session) {
      setSessionData({
        title: session.title,
        importantAction: session.importantAction,
        smartGoals: session.smartGoals,
        metastrategicThinking: session.metastrategicThinking,
        murphyjitsu: session.murphyjitsu || '',
        isCompleted: session.isCompleted,
        completedAt: session.completedAt,
      });
    } else {
      setSessionData(null);
    }
    // Reset editing mode when a new session is loaded
    setIsEditing(false);
  }, [session]);

  if (!session || !sessionData) {
    return null;
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };

  const handleSave = async () => {
    if (!session || !sessionData) return;

    await updateSessionMutation.mutate({
      id: session.id,
      session: sessionData
    });
    
    setIsEditing(false);
  };

  const handleToggleCompletion = async () => {
    if (!session || !sessionData) return;
    
    const now = new Date();
    await updateSessionMutation.mutate({
      id: session.id,
      session: {
        ...sessionData,
        isCompleted: !sessionData.isCompleted,
        completedAt: !sessionData.isCompleted ? now : null,
      }
    });
  };
  
  const buttonDisabled = 
    !sessionData.importantAction || 
    !sessionData.smartGoals || 
    !sessionData.metastrategicThinking;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-xl font-bold">
                {isEditing ? (
                  <input
                    type="text"
                    value={sessionData.title}
                    onChange={(e) => setSessionData({ ...sessionData, title: e.target.value })}
                    className="w-full border border-gray-300 p-2 rounded-md"
                  />
                ) : (
                  session.title
                )}
              </DialogTitle>
              <DialogDescription className="text-xs mt-1">
                <div className="flex flex-wrap gap-3">
                  <span className="flex items-center text-blue-600">
                    <Clock className="w-3 h-3 mr-1" />
                    Started on {formatDate(session.startedAt)}
                  </span>
                  {session.isCompleted && (
                    <span className="flex items-center text-green-600">
                      <Check className="w-3 h-3 mr-1" />
                      Completed on {formatDate(session.completedAt || session.updatedAt)}
                    </span>
                  )}
                </div>
              </DialogDescription>
            </div>
            {!isEditing && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto pr-1 pb-4 custom-scrollbar flex-grow">
          <div className="space-y-6">
            <div>
              <div className="flex items-center">
                <Label htmlFor="importantAction" className="text-base font-medium">
                  What is the most important thing I can do right now?
                </Label>
              </div>
              {isEditing ? (
                <Textarea
                  id="importantAction"
                  value={sessionData.importantAction}
                  onChange={(e) => setSessionData({ ...sessionData, importantAction: e.target.value })}
                  className="mt-1 min-h-24"
                  required
                />
              ) : (
                <div className="mt-1 p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                  {session.importantAction}
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-center">
                <Label htmlFor="smartGoals" className="text-base font-medium">
                  What are my specific, measurable, achievable, relevant, time-bound goals for this session?
                </Label>
              </div>
              {isEditing ? (
                <Textarea
                  id="smartGoals"
                  value={sessionData.smartGoals}
                  onChange={(e) => setSessionData({ ...sessionData, smartGoals: e.target.value })}
                  className="mt-1 min-h-24"
                  required
                />
              ) : (
                <div className="mt-1 p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                  {session.smartGoals}
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-center">
                <Label htmlFor="metastrategicThinking" className="text-base font-medium">
                  Metastrategic Brainstorming: What could I do in this situation that might help me make more progress?
                </Label>
              </div>
              {isEditing ? (
                <Textarea
                  id="metastrategicThinking"
                  value={sessionData.metastrategicThinking}
                  onChange={(e) => setSessionData({ ...sessionData, metastrategicThinking: e.target.value })}
                  className="mt-1 min-h-24"
                  required
                />
              ) : (
                <div className="mt-1 p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                  {session.metastrategicThinking}
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-center">
                <Label htmlFor="murphyjitsu" className="text-base font-medium">
                  Murphyjitsu: Anticipate Obstacles and Plan Responses
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="ml-1 h-6 w-6 p-0">
                        <HelpCircle className="h-4 w-4 text-gray-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-2 p-1 text-xs">
                        <p>1. Imagine a world where by the end of the session no significant progress has been made.</p>
                        <p>2. Explain why it happened.</p>
                        <p>3. Come up with strategies to address anticipated obstacles.</p>
                        <p>4. Imagine a world where you tried to use the strategies but by the end of the session no significant progress has been made.</p>
                        <p>5. Keep in mind that you might have failed to use the strategies.</p>
                        <p>6. Repeat steps 2-5 until failure would be sufficiently surprising.</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {isEditing ? (
                <Textarea
                  id="murphyjitsu"
                  value={sessionData.murphyjitsu || ''}
                  onChange={(e) => setSessionData({ ...sessionData, murphyjitsu: e.target.value })}
                  className="mt-1 min-h-24"
                />
              ) : (
                <div className="mt-1 p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                  {session.murphyjitsu || 'No murphyjitsu analysis recorded.'}
                </div>
              )}
            </div>
            
            {/* Session Reflection Section */}
            {session.isCompleted && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Work Session Reflection</h3>
                
                {sessionReflections.length > 0 ? (
                  <div className="space-y-4">
                    {sessionReflections.map((reflection: Review) => (
                      <div key={reflection.id} className="border border-gray-200 rounded-md p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium">{reflection.title}</h4>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                // Use the new route format for editing
                                setLocation(`/reviews/form/session/${session.id}/edit/${reflection.id}`);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this reflection?')) {
                                  deleteReview(reflection.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 whitespace-pre-wrap">
                          {reflection.preview}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-md">
                    <p className="text-gray-500 mb-3">No reflection has been added for this session yet.</p>
                    <Button
                      onClick={() => setLocation(`/reviews/form/session/${session.id}`)}
                      size="sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Add Reflection
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex-shrink-0 mt-4 pt-2 border-t">
          {isEditing ? (
            <>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={handleSave}
                disabled={buttonDisabled || updateSessionMutation.isPending}
              >
                {updateSessionMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this session and any associated reflections?')) {
                      // First delete all reflections associated with this session
                      sessionReflections.forEach((reflection: Review) => {
                        deleteReview(reflection.id);
                      });
                      
                      // Then delete the session using a direct API call
                      fetch(`/api/sessions/${session.id}`, {
                        method: 'DELETE',
                      }).then(() => {
                        toast({
                          title: "Session deleted",
                          description: "Your session has been deleted successfully"
                        });
                        onClose();
                      }).catch(error => {
                        toast({
                          title: "Error deleting session",
                          description: error.message,
                          variant: "destructive"
                        });
                      });
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Session
                </Button>
                
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                  
                  {!session.isCompleted && (
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => {
                        // Force a refresh before navigating
                        queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
                        setLocation(`/reviews/form/session/${session.id}`);
                      }}
                      className="ml-2"
                    >
                      Reflect
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}