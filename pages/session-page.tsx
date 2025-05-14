import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSessions } from "@/hooks/use-session";
import { usePlanningForm } from "@/hooks/use-planning-form";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { Plus, Clock, Check, Info, ChevronRight, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Sidebar from "@/components/sidebar/Sidebar";
import SessionDetailDialog from "@/components/session/SessionDetailDialog";
import { Session } from "@shared/schema";

export default function SessionPage() {
  const { user } = useAuth();
  const { sessions, isLoading, createSessionMutation, updateSessionMutation } = useSessions();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  
  // Force refresh data on page load
  useEffect(() => {
    // Reset cache and fetch fresh data
    queryClient.resetQueries({ queryKey: ["/api/sessions"] });
    queryClient.refetchQueries({ queryKey: ["/api/sessions"] });
  }, []);
  
  // Check URL parameters
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('new') === 'true';
  });
  
  // Always refresh session data when returning to this page
  useEffect(() => {
    console.log('Refreshing sessions data...');
    
    // Direct fetch to get updated sessions
    (async () => {
      try {
        // Clear existing cache
        queryClient.removeQueries({ queryKey: ["/api/sessions"] });
        
        // Fetch directly from API
        const response = await fetch('/api/sessions');
        if (response.ok) {
          const freshData = await response.json();
          console.log('Fresh sessions data:', freshData);
          
          // Update cache with fresh data
          queryClient.setQueryData(["/api/sessions"], freshData);
        }
      } catch (err) {
        console.error('Error refreshing sessions:', err);
      }
    })();
  }, []);
  
  // Clean up the URL if it contains the 'new' parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('new')) {
      // Remove the query parameter without refreshing the page
      const newUrl = window.location.pathname + 
        (params.size > 1 ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, []);
  
  const defaultTitle = `Work Session - ${format(new Date(), 'MMM d, yyyy')}`;
  
  const [sessionData, setSessionData] = useState({
    title: defaultTitle, // Default title with date
    importantAction: "",
    smartGoals: "",
    metastrategicThinking: "",
    murphyjitsu: "",
  });

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
      setIsCreateDialogOpen(false);
      // Update default title with current date when form is reset
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

  const handleSessionDetailClose = () => {
    setDetailDialogOpen(false);
    setSelectedSession(null);
    
    // Force refresh sessions data to update the UI
    queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    queryClient.refetchQueries({ queryKey: ["/api/sessions"] });
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'MMMM d, yyyy, h:mm a');
  };

  return (
    <div className="flex h-full">
      <Sidebar onCreateSession={() => setIsCreateDialogOpen(true)} />
      
      <main className="flex-1 overflow-auto bg-[#F8FAFC]">
        <div className="w-full px-2 sm:px-4 md:px-6 max-w-[1920px] mx-auto">
          <header className="my-3 md:my-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B]">Work Sessions</h1>
                <p className="text-sm text-[#64748B]">Create and review your work sessions</p>
              </div>
              <div className="mt-3 sm:mt-0">
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-[#2563EB] hover:bg-blue-700 text-xs sm:text-sm py-1.5 h-auto"
                  size="sm"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  New Work Session
                </Button>
              </div>
            </div>
          </header>

          <Tabs defaultValue={new URLSearchParams(window.location.search).get('tab') || "all"} className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Sessions</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader className="pb-2">
                        <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : sessions.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sessions.map(session => (
                    <Card key={session.id} className="overflow-hidden transition-all hover:shadow-md border-gray-200">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-medium">{session.title}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {session.isCompleted ? (
                                <span className="flex items-center text-green-600">
                                  <Check className="w-3 h-3 mr-1" />
                                  Completed on {formatDate(session.completedAt || session.updatedAt)}
                                </span>
                              ) : (
                                <span className="flex items-center text-blue-600">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Started on {formatDate(session.startedAt)}
                                </span>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2 text-sm">
                        <p className="text-gray-600 line-clamp-2">{session.importantAction}</p>
                      </CardContent>
                      <CardFooter className="pt-0 flex justify-end">
                        <Button 
                          variant="ghost"
                          size="sm"
                          className="text-xs p-0 h-8 px-2"
                          onClick={() => {
                            setSelectedSession(session);
                            setDetailDialogOpen(true);
                          }}
                        >
                          View Details
                          <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4 bg-white rounded-lg border border-gray-200">
                  <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-blue-50 mb-3">
                    <Info className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No sessions yet</h3>
                  <p className="text-gray-500 mb-4 max-w-md mx-auto">
                    Start by creating your first work session to track your goals and ideas
                  </p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-[#2563EB]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Work Session
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="active">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {!isLoading && sessions.filter(s => {
                  // Check session status in console for debugging
                  const isCompleted = s.isCompleted === true || !!s.completedAt;
                  console.log(`Session ${s.id}: Active check - isCompleted=${s.isCompleted}, completedAt=${s.completedAt}, showing in active=${!isCompleted}`);
                  // Only show sessions that are definitely not completed
                  return !isCompleted;
                }).map(session => (
                  <Card key={session.id} className="overflow-hidden transition-all hover:shadow-md border-gray-200">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-medium">{session.title}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            <span className="flex items-center text-blue-600">
                              <Clock className="w-3 h-3 mr-1" />
                              Started on {formatDate(session.startedAt)}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2 text-sm">
                      <p className="text-gray-600 line-clamp-2">{session.importantAction}</p>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-end">
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="text-xs p-0 h-8 px-2"
                        onClick={() => {
                          setSelectedSession(session);
                          setDetailDialogOpen(true);
                        }}
                      >
                        View Details
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
                
                {!isLoading && sessions.filter(s => !(s.isCompleted === true || !!s.completedAt)).length === 0 && (
                  <div className="col-span-full text-center py-8 px-4 bg-white rounded-lg border border-gray-200">
                    <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-blue-50 mb-3">
                      <Info className="h-6 w-6 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No active sessions</h3>
                    <p className="text-gray-500 mb-4 max-w-md mx-auto">
                      Create a new work session to begin your planning journey
                    </p>
                    <Button 
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-[#2563EB]"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Work Session
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>


          </Tabs>
        </div>
      </main>

      {/* Create Session Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                  onClick={() => setIsCreateDialogOpen(false)}
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
      
      {/* Session Detail Dialog */}
      <SessionDetailDialog 
        session={selectedSession}
        isOpen={detailDialogOpen}
        onClose={handleSessionDetailClose}
      />
    </div>
  );
}