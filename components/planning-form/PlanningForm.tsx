import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { HelpCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSessions } from '@/hooks/use-session';
import { usePlanningForm } from '@/hooks/use-planning-form';
import TaskList from './TaskList';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Task } from '@shared/schema';

export default function PlanningForm() {
  const { isOpen, closePlanningForm } = usePlanningForm();
  const { user } = useAuth();
  const { createSessionMutation } = useSessions();
  const queryClient = useQueryClient();
  
  const defaultTitle = `Work Session - ${format(new Date(), 'MMM d, yyyy')}`;
  
  const [sessionData, setSessionData] = useState({
    title: defaultTitle,
    importantAction: "",
    smartGoals: "",
    metastrategicThinking: "",
    murphyjitsu: "",
  });

  // Handle task completion toggle
  const handleTaskComplete = async (task: Task) => {
    try {
      await apiRequest('PUT', `/api/tasks/${task.id}`, {
        ...task,
        completed: !task.completed,
      });
      // Invalidate tasks query to refresh task list
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (user) {
      // Let the server handle the startedAt timestamp
      await createSessionMutation.mutate({
        ...sessionData,
        userId: user.id,
        isCompleted: false,
        // Omit startedAt entirely to let the server use the DB default
      });
      closePlanningForm();
      // Reset form data with new date
      const newDefaultTitle = `Work Session - ${format(new Date(), 'MMM d, yyyy')}`;
      setSessionData({
        title: newDefaultTitle,
        importantAction: "",
        smartGoals: "",
        metastrategicThinking: "",
        murphyjitsu: "",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closePlanningForm()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold">Work Session Form</DialogTitle>
          <DialogDescription>
            Take time to reflect on your goals and plan your next steps
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
          <div className="overflow-y-auto pr-1 pb-4 custom-scrollbar flex-grow">
            <div className="space-y-6">
              <div>
                <div className="flex items-center">
                  <Label htmlFor="importantAction" className="text-base font-medium">
                    What is the most important thing I can do right now?
                  </Label>
                </div>
                <Textarea
                  id="importantAction"
                  value={sessionData.importantAction}
                  onChange={(e) => setSessionData({ ...sessionData, importantAction: e.target.value })}
                  placeholder="Focus on your key priorities..."
                  className="mt-1 min-h-24"
                  required
                />
                
                {/* Next Actions Task List */}
                <div className="mt-3">
                  <Separator orientation="horizontal" className="mb-2" />
                  <TaskList 
                    onTaskComplete={handleTaskComplete}
                    isCompact={true}
                    setImportantAction={(text) => setSessionData({ ...sessionData, importantAction: text })}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center">
                  <Label htmlFor="smartGoals" className="text-base font-medium">
                    What are my specific, measurable, achievable, relevant, time-bound goals for this session?
                  </Label>
                </div>
                <Textarea
                  id="smartGoals"
                  value={sessionData.smartGoals}
                  onChange={(e) => setSessionData({ ...sessionData, smartGoals: e.target.value })}
                  placeholder="Define clear SMART goals..."
                  className="mt-1 min-h-24"
                  required
                />
              </div>
              
              <div>
                <div className="flex items-center">
                  <Label htmlFor="metastrategicThinking" className="text-base font-medium">
                    Metastrategic Brainstorming: What could I do in this situation that might help me make more progress?
                  </Label>
                </div>
                <Textarea
                  id="metastrategicThinking"
                  value={sessionData.metastrategicThinking}
                  onChange={(e) => setSessionData({ ...sessionData, metastrategicThinking: e.target.value })}
                  placeholder="Consider different approaches and strategies..."
                  className="mt-1 min-h-24"
                  required
                />
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
                <Textarea
                  id="murphyjitsu"
                  value={sessionData.murphyjitsu}
                  onChange={(e) => setSessionData({ ...sessionData, murphyjitsu: e.target.value })}
                  placeholder="Optional: Identify potential obstacles and plan how to overcome them..."
                  className="mt-1 min-h-24"
                />
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 mt-4 pt-2 border-t">
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={closePlanningForm}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createSessionMutation.isPending || !sessionData.importantAction || !sessionData.smartGoals || !sessionData.metastrategicThinking}
              >
                {createSessionMutation.isPending ? "Creating..." : "Create Work Session"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}