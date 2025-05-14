import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { ArrowLeft, Edit, Loader2, Check, Clock, Info, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import Sidebar from "@/components/sidebar/Sidebar";

export default function SessionDetailPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const sessionId = params?.id ? parseInt(params.id) : 0;
  const { session, isLoading, error, updateSessionMutation, deleteSessionMutation } = useSession(sessionId);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionData, setSessionData] = useState({
    title: "",
    importantAction: "",
    smartGoals: "",
    metastrategicThinking: "",
    murphyjitsu: "",
    isCompleted: false
  });
  
  // Initialize form data when session is loaded
  useEffect(() => {
    if (session) {
      setSessionData({
        title: session.title,
        importantAction: session.importantAction,
        smartGoals: session.smartGoals,
        metastrategicThinking: session.metastrategicThinking,
        murphyjitsu: session.murphyjitsu || "",
        isCompleted: session.isCompleted
      });
    }
  }, [session]);
  
  const handleUpdate = async () => {
    if (session) {
      const updatedSession = {
        ...sessionData,
        completedAt: sessionData.isCompleted && !session.isCompleted ? new Date().toISOString() : session.completedAt
      };
      
      await updateSessionMutation.mutate({
        id: session.id,
        session: updatedSession
      });
      
      setEditDialogOpen(false);
    }
  };
  
  const handleDelete = async () => {
    if (session) {
      await deleteSessionMutation.mutate(session.id);
      setLocation("/sessions");
    }
  };
  
  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return format(new Date(date), 'MMMM d, yyyy, h:mm a');
  };
  
  if (isLoading) {
    return (
      <div className="flex h-full">
        <Sidebar onCreateSession={() => {}} />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-2 text-gray-500">Loading session...</p>
          </div>
        </main>
      </div>
    );
  }
  
  if (error || !session) {
    return (
      <div className="flex h-full">
        <Sidebar onCreateSession={() => {}} />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-semibold">Session Not Found</h2>
            <p className="mt-2 text-gray-500">The session you're looking for doesn't exist or you don't have access to it.</p>
            <Button className="mt-4" onClick={() => setLocation("/sessions")}>
              Back to Sessions
            </Button>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex h-full">
      <Sidebar onCreateSession={() => {}} />
      
      <main className="flex-1 overflow-auto bg-[#F8FAFC]">
        <div className="w-full px-2 sm:px-4 md:px-6 max-w-[1920px] mx-auto">
          <header className="my-3 md:my-4">
            <div className="flex items-center mb-3">
              <Button
                variant="ghost"
                size="sm"
                className="mr-2 text-gray-500"
                onClick={() => setLocation("/sessions")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B]">{session.title}</h1>
                <p className="text-sm text-[#64748B] flex items-center mt-1">
                  {session.isCompleted ? (
                    <>
                      <Check className="w-4 h-4 mr-1 text-green-600" />
                      <span className="text-green-600 font-medium">Completed</span> • {formatDate(session.completedAt || session.updatedAt)}
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-1 text-blue-600" />
                      <span className="text-blue-600 font-medium">In Progress</span> • Started on {formatDate(session.startedAt)}
                    </>
                  )}
                </p>
              </div>
              <div className="mt-3 sm:mt-0 flex space-x-2">
                <Button 
                  onClick={() => {
                    setSessionData({
                      title: session.title,
                      importantAction: session.importantAction,
                      smartGoals: session.smartGoals,
                      metastrategicThinking: session.metastrategicThinking,
                      murphyjitsu: session.murphyjitsu || "",
                      isCompleted: session.isCompleted
                    });
                    setEditDialogOpen(true);
                  }}
                  variant="outline"
                  className="text-xs sm:text-sm py-1.5 h-auto"
                  size="sm"
                >
                  <Edit className="mr-1.5 h-3.5 w-3.5" />
                  Edit Session
                </Button>
                <Button 
                  onClick={() => setDeleteDialogOpen(true)}
                  variant="destructive"
                  className="text-xs sm:text-sm py-1.5 h-auto"
                  size="sm"
                >
                  Delete
                </Button>
              </div>
            </div>
          </header>

          <Tabs defaultValue="details" className="mt-4">
            <TabsList>
              <TabsTrigger value="details">Session Details</TabsTrigger>
              <TabsTrigger value="progress">Progress & Outcomes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Most Important Action</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{session.importantAction}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">SMART Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{session.smartGoals}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Metastrategic Brainstorming</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{session.metastrategicThinking}</p>
                </CardContent>
              </Card>
              
              {session.murphyjitsu && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Murphyjitsu (Obstacle Planning)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">{session.murphyjitsu}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="progress" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Progress Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 py-2 border-b border-gray-100">
                      <div className="font-medium text-gray-700 w-40">Status</div>
                      <div className="flex items-center">
                        {session.isCompleted ? (
                          <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full flex items-center">
                            <Check className="h-3 w-3 mr-1" />
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 py-2 border-b border-gray-100">
                      <div className="font-medium text-gray-700 w-40">Started</div>
                      <div>{formatDate(session.startedAt)}</div>
                    </div>
                    
                    {session.isCompleted && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 py-2 border-b border-gray-100">
                        <div className="font-medium text-gray-700 w-40">Completed</div>
                        <div>{formatDate(session.completedAt || session.updatedAt)}</div>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 py-2 border-b border-gray-100">
                      <div className="font-medium text-gray-700 w-40">Last Updated</div>
                      <div>{formatDate(session.updatedAt)}</div>
                    </div>
                  </div>
                  
                  {!session.isCompleted && (
                    <div className="mt-6">
                      <Button
                        onClick={() => {
                          setSessionData({
                            ...sessionData,
                            isCompleted: true
                          });
                          setEditDialogOpen(true);
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Mark as Completed
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Edit Session Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Session</DialogTitle>
            <DialogDescription>
              Update your work session information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="title" className="text-base font-medium">
                Session Title
              </Label>
              <Input
                id="title"
                value={sessionData.title}
                onChange={(e) => setSessionData({ ...sessionData, title: e.target.value })}
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="importantAction" className="text-base font-medium">
                What is the most important thing I can do right now?
              </Label>
              <Textarea
                id="importantAction"
                value={sessionData.importantAction}
                onChange={(e) => setSessionData({ ...sessionData, importantAction: e.target.value })}
                className="mt-1 min-h-24"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="smartGoals" className="text-base font-medium">
                What are my specific, measurable, achievable, relevant, time-bound goals for this session?
              </Label>
              <Textarea
                id="smartGoals"
                value={sessionData.smartGoals}
                onChange={(e) => setSessionData({ ...sessionData, smartGoals: e.target.value })}
                className="mt-1 min-h-24"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="metastrategicThinking" className="text-base font-medium">
                Metastrategic Brainstorming: What could I do in this situation that might help me make more progress?
              </Label>
              <Textarea
                id="metastrategicThinking"
                value={sessionData.metastrategicThinking}
                onChange={(e) => setSessionData({ ...sessionData, metastrategicThinking: e.target.value })}
                className="mt-1 min-h-24"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="murphyjitsu" className="text-base font-medium">
                Murphyjitsu: Anticipate Obstacles and Plan Responses
              </Label>
              <Textarea
                id="murphyjitsu"
                value={sessionData.murphyjitsu}
                onChange={(e) => setSessionData({ ...sessionData, murphyjitsu: e.target.value })}
                className="mt-1 min-h-24"
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="isCompleted"
                checked={sessionData.isCompleted}
                onCheckedChange={(checked) => setSessionData({ ...sessionData, isCompleted: checked })}
              />
              <Label htmlFor="isCompleted">Mark as completed</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={
                updateSessionMutation.isPending || 
                !sessionData.title || 
                !sessionData.importantAction || 
                !sessionData.smartGoals || 
                !sessionData.metastrategicThinking
              }
            >
              {updateSessionMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this session? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteSessionMutation.isPending}
            >
              {deleteSessionMutation.isPending ? "Deleting..." : "Delete Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}