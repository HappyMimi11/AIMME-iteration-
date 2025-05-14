import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, Edit, XCircle, Plus, MoreHorizontal, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/sidebar/Sidebar';
import { format } from 'date-fns';
import { Task, TaskGroup, InsertTask, InsertTaskGroup, UpdateTask, UpdateTaskGroup } from '@shared/schema';

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-orange-100 text-orange-800',
  high: 'bg-red-100 text-red-800',
};

export default function NextActionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    groupId: null as number | null,
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: null as string | null,
  });

  const [newGroup, setNewGroup] = useState({
    title: '',
    color: '#2563EB',
  });

  // Fetch task groups
  const { data: taskGroups = [], isLoading: isLoadingGroups } = useQuery<TaskGroup[]>({
    queryKey: ['/api/task-groups'],
    enabled: !!user,
  });

  // Fetch tasks
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    enabled: !!user,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (newTaskData: InsertTask) => {
      const res = await apiRequest('POST', '/api/tasks', newTaskData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setNewTaskDialogOpen(false);
      setNewTask({ title: '', description: '', groupId: null, priority: 'medium', dueDate: null });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, task }: { id: number; task: UpdateTask }) => {
      const res = await apiRequest('PUT', `/api/tasks/${id}`, task);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setEditTaskDialogOpen(false);
      setSelectedTask(null);
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (newGroupData: InsertTaskGroup) => {
      const res = await apiRequest('POST', '/api/task-groups', newGroupData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/task-groups'] });
      setNewGroupDialogOpen(false);
      setNewGroup({ title: '', color: '#2563EB' });
    },
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, group }: { id: number; group: UpdateTaskGroup }) => {
      const res = await apiRequest('PUT', `/api/task-groups/${id}`, group);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/task-groups'] });
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/task-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/task-groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
  });

  // Handle task completion toggle
  const handleTaskComplete = (task: Task) => {
    updateTaskMutation.mutate({
      id: task.id,
      task: { ...task, completed: !task.completed },
    });
  };

  // Handle creating new task
  const handleCreateTask = () => {
    if (!newTask.title.trim() || !newTask.groupId) return;
    
    // Find the maximum order in the current group
    const tasksInGroup = tasks.filter(t => t.groupId === newTask.groupId);
    const maxOrder = tasksInGroup.length ? Math.max(...tasksInGroup.map(t => t.order)) : -1;

    createTaskMutation.mutate({
      title: newTask.title,
      description: newTask.description,
      groupId: newTask.groupId,
      userId: user!.id,
      order: maxOrder + 1,
      priority: newTask.priority,
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
      completed: false,
    });
  };

  // Handle creating new group
  const handleCreateGroup = () => {
    if (!newGroup.title.trim()) return;
    
    // Find the maximum order
    const maxOrder = taskGroups.length ? Math.max(...taskGroups.map(g => g.order)) : -1;
    
    createGroupMutation.mutate({
      title: newGroup.title,
      color: newGroup.color,
      userId: user!.id,
      order: maxOrder + 1,
    });
  };

  // Handle updating task
  const handleUpdateTask = () => {
    if (!selectedTask || !selectedTask.title.trim()) return;
    
    if (selectedTask.groupId === null) return;
    
    updateTaskMutation.mutate({
      id: selectedTask.id,
      task: {
        title: selectedTask.title,
        description: selectedTask.description || '',
        groupId: selectedTask.groupId,
        order: selectedTask.order,
        priority: selectedTask.priority as 'low' | 'medium' | 'high',
        dueDate: selectedTask.dueDate || null,
        completed: selectedTask.completed,
      },
    });
  };

  // Handle deleting task
  const handleDeleteTask = (taskId: number) => {
    deleteTaskMutation.mutate(taskId);
  };

  // Handle deleting group and all its tasks
  const handleDeleteGroup = (groupId: number) => {
    deleteGroupMutation.mutate(groupId);
  };

  // Handle drag and drop
  const handleDragEnd = (result: any) => {
    const { source, destination, type } = result;
    
    // Dropped outside the list
    if (!destination) return;
    
    // No change
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    // Handling group reordering
    if (type === 'GROUP') {
      const reorderedGroups = Array.from(taskGroups);
      const [removed] = reorderedGroups.splice(source.index, 1);
      reorderedGroups.splice(destination.index, 0, removed);
      
      // Update the order field for each group
      reorderedGroups.forEach((group, index) => {
        updateGroupMutation.mutate({
          id: group.id,
          group: { ...group, order: index },
        });
      });
    }
    // Handling task reordering
    else if (type === 'TASK') {
      const sourceGroupId = parseInt(source.droppableId);
      const destGroupId = parseInt(destination.droppableId);
      
      // Get tasks for source and destination groups
      const sourceTasks = tasks.filter(t => t.groupId === sourceGroupId).sort((a, b) => a.order - b.order);
      
      // Moving within the same group
      if (sourceGroupId === destGroupId) {
        const reorderedTasks = Array.from(sourceTasks);
        const [removed] = reorderedTasks.splice(source.index, 1);
        reorderedTasks.splice(destination.index, 0, removed);
        
        // Update the order field for each task
        reorderedTasks.forEach((task, index) => {
          updateTaskMutation.mutate({
            id: task.id,
            task: { ...task, order: index },
          });
        });
      } 
      // Moving between groups
      else {
        const destTasks = tasks.filter(t => t.groupId === destGroupId).sort((a, b) => a.order - b.order);
        
        // Task being moved
        const taskToMove = sourceTasks[source.index];
        
        // Remove from source list
        const newSourceTasks = sourceTasks.filter(t => t.id !== taskToMove.id);
        
        // Insert into destination list
        const newDestTasks = Array.from(destTasks);
        newDestTasks.splice(destination.index, 0, { ...taskToMove, groupId: destGroupId });
        
        // Update the moved task with new group and order
        updateTaskMutation.mutate({
          id: taskToMove.id,
          task: { 
            ...taskToMove, 
            groupId: destGroupId,
            order: destination.index 
          },
        });
        
        // Update order for source tasks
        newSourceTasks.forEach((task, index) => {
          updateTaskMutation.mutate({
            id: task.id,
            task: { ...task, order: index },
          });
        });
        
        // Update order for destination tasks (except the newly added one)
        newDestTasks.forEach((task, index) => {
          if (task.id === taskToMove.id) return; // Skip the task we just updated
          if (index >= destination.index) {
            // Only update tasks that are after the insertion point
            updateTaskMutation.mutate({
              id: task.id,
              task: { ...task, order: index + 1 },
            });
          }
        });
      }
    }
  };

  // Edit task dialog
  const openEditTaskDialog = (task: Task) => {
    setSelectedTask(task);
    setEditTaskDialogOpen(true);
  };

  // Group tasks by groupId
  const getTasksByGroup = (groupId: number) => {
    return tasks
      .filter(task => task.groupId === groupId)
      .sort((a, b) => a.order - b.order);
  };

  // Sorted groups
  const sortedGroups = [...taskGroups].sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="flex h-full">
        <Sidebar onCreateSession={() => setNewTaskDialogOpen(true)} />
        
        <main className="flex-1 overflow-auto bg-[#F8FAFC]">
          <div className="w-full px-2 sm:px-4 md:px-6 max-w-[1920px] mx-auto">
            <header className="my-3 md:my-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#1E293B]">Next Actions</h1>
                  <p className="text-sm text-[#64748B]">Organize and prioritize your tasks</p>
                </div>
                <div className="mt-3 sm:mt-0 flex space-x-2">
                  <Button 
                    onClick={() => setNewTaskDialogOpen(true)}
                    className="bg-[#2563EB] hover:bg-blue-700 text-xs sm:text-sm py-1.5 h-auto"
                    size="sm"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    New Task
                  </Button>
                  <Button 
                    onClick={() => setNewGroupDialogOpen(true)}
                    variant="outline"
                    className="border-[#2563EB] text-[#2563EB] text-xs sm:text-sm py-1.5 h-auto"
                    size="sm"
                  >
                    <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                    New Group
                  </Button>
                </div>
              </div>
            </header>

            {isLoadingGroups || isLoadingTasks ? (
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-1 px-3 py-2">
                      <div className="h-6 bg-gray-200 rounded w-1/2 mb-1"></div>
                    </CardHeader>
                    <CardContent className="px-3 py-2">
                      <div className="space-y-2">
                        <div className="h-8 bg-gray-200 rounded"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="groups" type="GROUP" direction="horizontal">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                    >
                      {sortedGroups.map((group, index) => (
                        <Draggable 
                          key={group.id} 
                          draggableId={`group-${group.id}`} 
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="flex flex-col"
                            >
                              <Card className="h-full shadow-sm border border-gray-200">
                                <CardHeader 
                                  className="pb-1 px-3 py-2 flex flex-row justify-between items-center"
                                  {...provided.dragHandleProps}
                                >
                                  <div className="flex items-center">
                                    <div 
                                      className="w-2.5 h-2.5 rounded-full mr-1.5" 
                                      style={{ backgroundColor: group.color || '#2563EB' }}
                                    ></div>
                                    <CardTitle className="text-base font-medium">
                                      {group.title}
                                    </CardTitle>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleDeleteGroup(group.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-gray-500" />
                                  </Button>
                                </CardHeader>
                                <CardContent className="pt-1 px-2 py-1">
                                  <Droppable droppableId={`${group.id}`} type="TASK">
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="space-y-1.5 min-h-[40px]"
                                      >
                                        {getTasksByGroup(group.id).map((task, index) => (
                                          <Draggable
                                            key={task.id}
                                            draggableId={`task-${task.id}`}
                                            index={index}
                                          >
                                            {(provided) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={`bg-white p-2 rounded-md border border-gray-100 shadow-sm hover:shadow transition-all ${
                                                  task.completed ? 'opacity-60' : ''
                                                }`}
                                              >
                                                <div className="flex items-start gap-1.5">
                                                  <Checkbox
                                                    checked={task.completed}
                                                    onCheckedChange={() => handleTaskComplete(task)}
                                                    className="mt-0.5 h-3.5 w-3.5"
                                                  />
                                                  <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-medium mb-1 truncate ${
                                                      task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                                                    }`}>
                                                      {task.title}
                                                    </p>
                                                    {task.description && (
                                                      <p className="text-[10px] text-gray-500 line-clamp-1">
                                                        {task.description}
                                                      </p>
                                                    )}
                                                    <div className="flex items-center mt-1 text-[10px] flex-wrap gap-1">
                                                      {task.dueDate && (
                                                        <span className="text-gray-500 text-[10px]">
                                                          {format(new Date(task.dueDate), 'MMM d')}
                                                        </span>
                                                      )}
                                                      <span className={`${priorityColors[task.priority as keyof typeof priorityColors]} px-1.5 py-0.5 rounded-full text-[10px]`}>
                                                        {task.priority}
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <div className="flex gap-0.5 ml-1 flex-shrink-0">
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-6 w-6 p-0"
                                                      onClick={() => openEditTaskDialog(task)}
                                                    >
                                                      <Edit className="h-3 w-3 text-gray-500" />
                                                    </Button>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                                                      onClick={() => handleDeleteTask(task.id)}
                                                    >
                                                      <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="w-full justify-start text-xs text-gray-500 mt-1 h-7 py-0"
                                          onClick={() => {
                                            setSelectedGroup(group.id);
                                            setNewTask({ ...newTask, groupId: group.id });
                                            setNewTaskDialogOpen(true);
                                          }}
                                        >
                                          <Plus className="h-3.5 w-3.5 mr-1" />
                                          Add task
                                        </Button>
                                      </div>
                                    )}
                                  </Droppable>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}

            {taskGroups.length === 0 && !isLoadingGroups && (
              <div className="text-center py-6 sm:py-8 px-4 bg-white rounded-lg border border-gray-200 shadow-sm mt-4">
                <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 flex items-center justify-center rounded-full mb-3">
                  <PlusCircle className="h-6 w-6 sm:h-7 sm:w-7 text-[#2563EB]" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1.5">No task groups yet</h3>
                <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                  Create your first task group to start organizing your tasks by category or project
                </p>
                <Button 
                  onClick={() => setNewGroupDialogOpen(true)}
                  className="bg-[#2563EB] hover:bg-blue-700 text-xs sm:text-sm py-1.5 h-auto"
                  size="sm"
                >
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                  Create Task Group
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* New Task Dialog */}
      <Dialog open={newTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Create New Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="task-title" className="text-sm">Title</Label>
              <Input
                id="task-title"
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="task-description" className="text-sm">Description (optional)</Label>
              <Textarea
                id="task-description"
                placeholder="Add details about this task"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="min-h-[60px] text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="task-group" className="text-sm">Group</Label>
              <Select
                value={newTask.groupId?.toString() || ''}
                onValueChange={(value) => setNewTask({ ...newTask, groupId: parseInt(value) })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {taskGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()} className="text-sm">
                      {group.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="task-priority" className="text-sm">Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value: any) => setNewTask({ ...newTask, priority: value as 'low' | 'medium' | 'high' })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low" className="text-sm">Low</SelectItem>
                    <SelectItem value="medium" className="text-sm">Medium</SelectItem>
                    <SelectItem value="high" className="text-sm">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="task-due-date" className="text-sm">Due Date</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={newTask.dueDate || ''}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setNewTaskDialogOpen(false)}
              className="text-xs h-8"
              size="sm"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTask} 
              disabled={!newTask.title || !newTask.groupId}
              className="text-xs h-8"
              size="sm"
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editTaskDialogOpen} onOpenChange={setEditTaskDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Edit Task</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="grid gap-3 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-task-title" className="text-sm">Title</Label>
                <Input
                  id="edit-task-title"
                  value={selectedTask.title}
                  onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-task-description" className="text-sm">Description (optional)</Label>
                <Textarea
                  id="edit-task-description"
                  value={selectedTask.description || ''}
                  onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                  className="min-h-[60px] text-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-task-group" className="text-sm">Group</Label>
                <Select
                  value={selectedTask.groupId ? selectedTask.groupId.toString() : ''}
                  onValueChange={(value) => setSelectedTask({ ...selectedTask, groupId: parseInt(value) })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()} className="text-sm">
                        {group.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-task-priority" className="text-sm">Priority</Label>
                  <Select
                    value={selectedTask.priority || 'medium'}
                    onValueChange={(value: any) => setSelectedTask({ ...selectedTask, priority: value as 'low' | 'medium' | 'high' })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low" className="text-sm">Low</SelectItem>
                      <SelectItem value="medium" className="text-sm">Medium</SelectItem>
                      <SelectItem value="high" className="text-sm">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-task-due-date" className="text-sm">Due Date</Label>
                  <Input
                    id="edit-task-due-date"
                    type="date"
                    value={selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      setSelectedTask({ ...selectedTask, dueDate: date });
                    }}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="edit-task-completed"
                  checked={selectedTask.completed}
                  onCheckedChange={(checked) => setSelectedTask({ ...selectedTask, completed: !!checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="edit-task-completed" className="text-sm">Mark as completed</Label>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setEditTaskDialogOpen(false)}
              className="text-xs h-8"
              size="sm"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTask} 
              disabled={!selectedTask?.title}
              className="text-xs h-8"
              size="sm"
            >
              Update Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Group Dialog */}
      <Dialog open={newGroupDialogOpen} onOpenChange={setNewGroupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Create New Group</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="group-title" className="text-sm">Title</Label>
              <Input
                id="group-title"
                placeholder="Group title"
                value={newGroup.title}
                onChange={(e) => setNewGroup({ ...newGroup, title: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="group-color" className="text-sm">Color</Label>
              <div className="flex flex-wrap gap-2">
                {['#2563EB', '#4F46E5', '#D946EF', '#EC4899', '#F59E0B', '#10B981', '#64748B'].map(color => (
                  <div 
                    key={color}
                    className={`w-7 h-7 rounded-full cursor-pointer transition-all ${newGroup.color === color ? 'ring-2 ring-offset-1 ring-blue-500 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewGroup({ ...newGroup, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setNewGroupDialogOpen(false)}
              className="text-xs h-8"
              size="sm"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateGroup} 
              disabled={!newGroup.title}
              className="text-xs h-8"
              size="sm"
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}