import { useState, useRef, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useDocuments } from '@/hooks/use-document';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlanningForm } from '@/hooks/use-planning-form';
import { 
  Inbox, Plus, ChevronLeft, Search, Lightbulb, Calendar,
  MessageSquare, Settings, Brain, CheckSquare, Folder, FileText,
  Archive, Cloud, Clock, Wand2, Sun, CalendarDays,
  CalendarRange, Repeat, Wrench
} from 'lucide-react';

// Define types for sidebar items
interface RegularSidebarItem {
  name: string;
  icon: ReactNode;
  path: string;
  splitLink?: false;
}

interface SplitSidebarItem {
  name: string;
  icon: ReactNode;
  splitLink: true;
  listPath: string;
  formPath: string;
}

type SidebarItem = RegularSidebarItem | SplitSidebarItem;

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface SidebarProps {
  onCreateSession?: () => void;
}

export default function Sidebar({ onCreateSession }: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { openPlanningForm } = usePlanningForm();
  
  const { documents, isLoading } = useDocuments();
  
  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const minWidth = 60;
  const maxWidth = 300;

  useEffect(() => {
    const sidebar = sidebarRef.current;
    
    if (sidebar) {
      sidebar.style.width = `${sidebarWidth}px`;
      sidebar.style.minWidth = `${sidebarWidth}px`;
    }
  }, [sidebarWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      let newWidth = e.clientX;
      
      if (newWidth < minWidth) newWidth = minWidth;
      if (newWidth > maxWidth) newWidth = maxWidth;
      
      setSidebarWidth(newWidth);
      
      // Determine if sidebar should be collapsed
      if (newWidth <= minWidth + 20) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  };

  const toggleSidebar = () => {
    if (isCollapsed) {
      setSidebarWidth(240);
      setIsCollapsed(false);
    } else {
      setSidebarWidth(minWidth);
      setIsCollapsed(true);
    }
  };

  const handleMouseEnter = () => {
    if (isCollapsed && !isResizing) {
      setSidebarWidth(240);
    }
  };

  const handleMouseLeave = () => {
    if (isCollapsed && !isResizing) {
      setSidebarWidth(minWidth);
    }
  };

  // Sidebar navigation items structure based on the image
  const navSections: SidebarSection[] = [
    {
      title: '',
      items: [
        { name: 'AI Assistant', icon: <MessageSquare className="h-4 w-4" />, path: '/document/category/ai_assistance' },
        { name: 'Settings | Search', icon: <Settings className="h-4 w-4" />, path: '/document/category/settings_search' }
      ]
    },
    {
      title: '',
      items: [
        { name: 'Collection Bucket', icon: <Inbox className="h-4 w-4" />, path: '/document/category/collection_bucket' }
      ]
    },
    {
      title: 'Actionables',
      items: [
        { name: 'Next Actions', icon: <CheckSquare className="h-4 w-4" />, path: '/next-actions' },
        { name: 'Projects', icon: <Folder className="h-4 w-4" />, path: '/document/category/actionables/projects' },
        { name: 'Reference for Projects', icon: <FileText className="h-4 w-4" />, path: '/document/category/actionables/references' }
      ]
    },
    {
      title: 'Non-Actionables',
      items: [
        { name: 'Reference/Filing', icon: <Archive className="h-4 w-4" />, path: '/document/category/non_actionables/filing' },
        { name: 'Maybe Someday', icon: <Cloud className="h-4 w-4" />, path: '/document/category/non_actionables/someday' },
        { name: 'Waiting For', icon: <Clock className="h-4 w-4" />, path: '/document/category/non_actionables/waiting' }
      ]
    },
    {
      title: 'Prioritization',
      items: [
        { name: 'Marginal Gains Analysis', icon: <Wand2 className="h-4 w-4" />, path: '/document/category/prioritization' }
      ]
    },
    {
      title: 'Reviews',
      items: [
        { 
          name: 'Daily', 
          icon: <Sun className="h-4 w-4" />, 
          splitLink: true,
          listPath: '/document/category/reviews/daily',
          formPath: '/reviews/form/daily'
        },
        { 
          name: 'Weekly', 
          icon: <Calendar className="h-4 w-4" />, 
          splitLink: true,
          listPath: '/document/category/reviews/weekly',
          formPath: '/reviews/form/weekly'
        },
        { 
          name: 'Monthly', 
          icon: <CalendarDays className="h-4 w-4" />, 
          splitLink: true,
          listPath: '/document/category/reviews/monthly',
          formPath: '/reviews/form/monthly'
        },
        { 
          name: 'Yearly', 
          icon: <CalendarRange className="h-4 w-4" />, 
          splitLink: true,
          listPath: '/document/category/reviews/yearly',
          formPath: '/reviews/form/yearly'
        },
        { 
          name: 'Kolb\'s Experiential Learning Cycle', 
          icon: <Repeat className="h-4 w-4" />, 
          splitLink: true,
          listPath: '/document/category/reviews/experiential',
          formPath: '/reviews/form/experiential'
        }
      ]
    },
    {
      title: '',
      items: [
        { name: 'Learning Dashboard', icon: <Lightbulb className="h-4 w-4" />, path: '/document/category/learning_dashboard' },
        { name: 'Strategy Toolbox', icon: <Wrench className="h-4 w-4" />, path: '/document/category/strategy_toolbox' },
        { name: 'Database', icon: <FileText className="h-4 w-4" />, path: '/' },
        { name: 'Sessions', icon: <Brain className="h-4 w-4" />, path: '/sessions' }
      ]
    }
  ];

  return (
    <aside 
      ref={sidebarRef}
      className={`sidebar bg-sidebar h-full flex flex-col relative transition-all duration-300 ease-in-out ${isCollapsed ? 'sidebar-collapsed' : ''}`}
      style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Resizer Handle */}
      <div 
        ref={resizerRef}
        className="sidebar-resizer"
        onMouseDown={startResizing}
      />
      
      {/* Sidebar Header - simplified */}
      <div className="px-3 py-2 flex items-center justify-end border-b border-sidebar-border">
        <button 
          className="text-gray-400 hover:text-white focus:outline-none"
          onClick={toggleSidebar}
        >
          <ChevronLeft className="h-5 w-5 sidebar-toggle-icon" />
        </button>
      </div>
      
      {/* Sidebar Navigation */}
      <nav className="flex-1 overflow-y-auto pt-2 pb-2">
        <div className="px-2 space-y-1">
          {/* Search Box */}
          <div className="relative mb-2">
            <Input
              type="text"
              placeholder="Search..."
              className="w-full bg-gray-700 rounded-md py-1.5 pl-8 pr-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-accent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="h-3 w-3 absolute left-2.5 top-2.5 text-gray-400" />
          </div>
          
          {/* Navigation Items */}
          <div className="space-y-1.5">
            {navSections.map((section) => (
              <div key={section.title || Math.random().toString()} className="space-y-0.5">
                {!isCollapsed && section.title && (
                  <h3 className="text-gray-400 text-[10px] uppercase font-bold px-1 pb-0">
                    {section.title}
                  </h3>
                )}
                {section.items.map((item) => {
                  if ('path' in item) {
                    // Regular link item
                    const isActive = location === item.path;
                    return (
                      <Link 
                        key={item.path} 
                        href={item.path}
                      >
                        <div 
                          className={`flex items-center px-1.5 py-1 text-xs rounded-md cursor-pointer ${
                            isActive 
                              ? 'text-white bg-gray-700' 
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                          } group`}
                        >
                          <span className="mr-2 text-gray-300">{item.icon}</span>
                          {!isCollapsed && <span>{item.name}</span>}
                        </div>
                      </Link>
                    );
                  } else {
                    // Split link item
                    const isListActive = location === item.listPath;
                    const isFormActive = location === item.formPath;
                    
                    return (
                      <div key={item.name} className="flex items-center">
                        {isCollapsed ? (
                          // Collapsed mode - show just the icon linked to list view
                          <Link href={item.listPath} className="w-full">
                            <div 
                              className={`flex items-center justify-center px-1.5 py-1 text-xs rounded-md cursor-pointer ${
                                isListActive
                                  ? 'text-white bg-gray-700' 
                                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                              } group w-full`}
                            >
                              <span className="text-gray-300">{item.icon}</span>
                            </div>
                          </Link>
                        ) : (
                          // Expanded mode - show split view
                          <div className="flex w-full gap-[1px]">
                            <Link href={item.listPath} className="w-1/2">
                              <div 
                                className={`flex items-center px-1.5 py-1 text-xs rounded-l-md cursor-pointer ${
                                  isListActive
                                    ? 'text-white bg-gray-700' 
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                } group w-full`}
                              >
                                <span className="mr-2 text-gray-300">{item.icon}</span>
                                <span className="truncate">{item.name}</span>
                              </div>
                            </Link>
                            
                            <Link href={item.formPath} className="w-1/2">
                              <div 
                                className={`flex items-center px-1.5 py-1 text-xs rounded-r-md cursor-pointer ${
                                  isFormActive
                                    ? 'text-white bg-gray-700' 
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                } group w-full`}
                              >
                                <span className="text-gray-500 mr-1">/</span>
                                <Plus className="h-3 w-3" />
                              </div>
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  }
                })}
              </div>
            ))}

            {/* Recent Documents */}
            {!isCollapsed && searchQuery && (
              <div className="space-y-1">
                <h3 className="text-gray-400 text-xs uppercase font-bold px-2">
                  Search Results
                </h3>
                {isLoading ? (
                  <div className="space-y-2 px-2 py-1">
                    <Skeleton className="h-8 w-full bg-gray-700" />
                    <Skeleton className="h-8 w-full bg-gray-700" />
                  </div>
                ) : (
                  filteredDocuments.length > 0 ? (
                    filteredDocuments.map(doc => (
                      <Link 
                        key={doc.id} 
                        href={`/document/${doc.id}`}
                      >
                        <div className="flex items-center px-2 py-2 text-base rounded-md text-gray-300 hover:bg-gray-700 hover:text-white group cursor-pointer">
                          <span className="truncate">{doc.title}</span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm px-2">No documents found</p>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
      
      {/* Planning Form Button */}
      <div className="border-t border-sidebar-border p-2">
        <Button 
          className="w-full flex items-center justify-center py-1 text-xs"
          size="sm"
          onClick={() => {
            // Always use the global planning form
            openPlanningForm();
          }}
        >
          <Plus className="h-3 w-3 mr-1" />
          {!isCollapsed && "Open Work Session Form"}
        </Button>
      </div>
    </aside>
  );
}