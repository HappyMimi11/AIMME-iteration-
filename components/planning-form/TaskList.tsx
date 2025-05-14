import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { format } from 'date-fns';
import { Task, TaskGroup } from '@shared/schema';

// Priority badge colors
const priorityColors = {
  low: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  medium: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  high: 'bg-red-100 text-red-800 hover:bg-red-200',
};

interface TaskListProps {
  onTaskComplete?: (task: Task) => void;
  isCompact?: boolean;
  setImportantAction?: (text: string) => void;
}

export default function TaskList({ onTaskComplete, isCompact = true, setImportantAction }: TaskListProps) {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

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

  // Group tasks by groupId
  const tasksByGroup = useMemo(() => {
    const grouped = new Map<number, Task[]>();
    
    // Initialize with empty arrays for all groups
    taskGroups.forEach(group => {
      grouped.set(group.id, []);
    });
    
    // Fill with tasks
    tasks.forEach(task => {
      if (task.groupId) {
        const groupTasks = grouped.get(task.groupId) || [];
        groupTasks.push(task);
        grouped.set(task.groupId, groupTasks);
      }
    });
    
    // Sort tasks within each group by order
    grouped.forEach((groupTasks, groupId) => {
      grouped.set(groupId, [...groupTasks].sort((a, b) => a.order - b.order));
    });
    
    return grouped;
  }, [tasks, taskGroups]);

  // Sorted groups
  const sortedGroups = useMemo(() => {
    return [...taskGroups].sort((a, b) => a.order - b.order);
  }, [taskGroups]);

  if (isLoadingGroups || isLoadingTasks) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        <span className="ml-2 text-xs text-gray-500">Loading tasks...</span>
      </div>
    );
  }

  if (taskGroups.length === 0) {
    return (
      <div className="text-center py-3 bg-gray-50 rounded-md">
        <p className="text-xs text-gray-500">No task groups found</p>
        <Button 
          variant="link" 
          size="sm"
          className="mt-1 p-0 h-6 text-xs text-blue-600"
          onClick={() => window.open('/next-actions', '_blank')}
        >
          Manage tasks in Next Actions
        </Button>
      </div>
    );
  }

  // Filter out empty groups when in compact mode
  const visibleGroups = isCompact
    ? sortedGroups.filter(group => (tasksByGroup.get(group.id) || []).length > 0)
    : sortedGroups;
    
  // Handle selecting a task to fill the important action field
  const handleSelectTask = (task: Task) => {
    if (setImportantAction) {
      const taskText = task.description 
        ? `${task.title}\n\n${task.description}` 
        : task.title;
      setImportantAction(taskText);
    }
  };

  // If hiding tasks, just show controls
  if (!isVisible) {
    return (
      <div className="flex items-center justify-between bg-gray-50 rounded-md p-2">
        <span className="text-xs text-gray-500">Tasks hidden</span>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsVisible(true)}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-6 w-6 p-0 text-blue-600"
            onClick={() => window.open('/next-actions', '_blank')}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }
  
  // If there are no tasks in any group in compact mode, show a message
  if (isCompact && visibleGroups.length === 0) {
    return (
      <div className="flex items-center justify-between bg-gray-50 rounded-md p-2">
        <span className="text-xs text-gray-500">No active tasks</span>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsVisible(false)}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-6 w-6 p-0 text-blue-600"
            onClick={() => window.open('/next-actions', '_blank')}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-1">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-700">My Tasks</span>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsVisible(false)}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-6 w-6 p-0 text-blue-600"
            onClick={() => window.open('/next-actions', '_blank')}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {/* Task groups */}
      {visibleGroups.map(group => {
        const groupTasks = tasksByGroup.get(group.id) || [];
        
        return (
          <Card key={group.id} className="shadow-sm border border-gray-200">
            <CardHeader className="px-2 py-1 flex flex-row justify-between items-center">
              <div className="flex items-center">
                <div 
                  className="w-2 h-2 rounded-full mr-1" 
                  style={{ backgroundColor: group.color || '#2563EB' }}
                />
                <CardTitle className="text-xs font-medium">
                  {group.title}
                </CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="px-2 py-1">
              <div className="space-y-1">
                {groupTasks.slice(0, 5).map(task => (
                  <div 
                    key={task.id}
                    className={`
                      bg-white py-1 px-1.5 rounded border border-gray-100
                      hover:bg-gray-50 cursor-pointer transition-colors
                      ${task.completed ? 'opacity-60' : ''}
                    `}
                    onClick={() => handleSelectTask(task)}
                  >
                    <div className="flex items-start gap-1">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => {
                          onTaskComplete && onTaskComplete(task);
                        }}
                        className="mt-0.5 h-3 w-3"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${
                          task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </p>
                        {task.priority !== 'medium' && (
                          <Badge 
                            variant="secondary"
                            className={`px-1 py-0 h-3 text-[8px] ${priorityColors[task.priority as keyof typeof priorityColors]}`}
                          >
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Show count of hidden tasks if in compact mode */}
                {groupTasks.length > 5 && (
                  <div className="text-center text-[10px] text-gray-500">
                    +{groupTasks.length - 5} more
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}