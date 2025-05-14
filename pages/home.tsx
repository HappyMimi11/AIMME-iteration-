import { useState } from 'react';
import { useLocation } from 'wouter';
import Sidebar from '@/components/sidebar/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDocuments, useDocument } from '@/hooks/use-document';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  CalendarDays, 
  Clock, 
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';

export default function Home() {
  const [_, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('collection_bucket');
  const { createDocument } = useDocument();
  const { documents, isLoading } = useDocuments();
  
  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) return;
    
    const newDoc = await createDocument({
      title: newDocTitle,
      category: newDocCategory,
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: newDocTitle }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '' }]
          }
        ]
      }
    });
    
    setIsCreateDialogOpen(false);
    setNewDocTitle('');
    
    // Navigate to the new document
    if (newDoc?.id) {
      setLocation(`/document/${newDoc.id}`);
    }
  };

  // Group documents by category
  const documentsByCategory = documents.reduce((acc, doc) => {
    const category = doc.category || 'uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>);

  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <>
      <div className="flex h-full">
        <Sidebar onCreateSession={() => setIsCreateDialogOpen(true)} />
        
        <main className="flex-1 overflow-auto bg-white">
          <div className="container mx-auto px-4 py-6">
            <header className="mb-6">
              <h1 className="text-3xl font-semibold text-secondary font-caveat">My Documents</h1>
              <p className="text-muted-foreground">Manage your notes and documents</p>
            </header>

            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All Documents</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-medium font-caveat">All Documents</h2>
                </div>
                
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                      <Card key={i} className="h-48 animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
                          <div className="h-4 bg-gray-200 rounded mb-2 w-5/6"></div>
                          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map(doc => (
                      <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setLocation(`/document/${doc.id}`)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-medium">{doc.title}</CardTitle>
                          <CardDescription className="flex items-center text-xs text-muted-foreground">
                            <CalendarDays className="h-3 w-3 mr-1" />
                            {format(new Date(doc.updatedAt), 'MMM dd, yyyy')}
                            <Separator orientation="vertical" className="mx-2 h-3" />
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(doc.updatedAt), 'h:mm a')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {doc.category}
                          </p>
                        </CardContent>
                        <CardFooter className="pt-0">
                          <Button variant="ghost" size="sm" className="ml-auto" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/document/${doc.id}`);
                            }}
                          >
                            Open
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-secondary mb-2">No documents yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first document to get started</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Document
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="recent" className="mt-6">
                <h2 className="text-xl font-medium mb-4">Recently Updated</h2>
                {recentDocuments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentDocuments.map(doc => (
                      <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setLocation(`/document/${doc.id}`)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-medium">{doc.title}</CardTitle>
                          <CardDescription className="flex items-center text-xs text-muted-foreground">
                            <CalendarDays className="h-3 w-3 mr-1" />
                            {format(new Date(doc.updatedAt), 'MMM dd, yyyy')}
                            <Separator orientation="vertical" className="mx-2 h-3" />
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(doc.updatedAt), 'h:mm a')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {doc.category}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No recent documents</p>
                )}
              </TabsContent>
              
              <TabsContent value="categories" className="mt-6">
                {Object.entries(documentsByCategory).map(([category, docs]) => (
                  <div key={category} className="mb-8">
                    <h2 className="text-xl font-medium mb-4 capitalize">
                      {category.replace('_', ' ')}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {docs.map(doc => (
                        <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setLocation(`/document/${doc.id}`)}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium">{doc.title}</CardTitle>
                            <CardDescription className="flex items-center text-xs text-muted-foreground">
                              <CalendarDays className="h-3 w-3 mr-1" />
                              {format(new Date(doc.updatedAt), 'MMM dd, yyyy')}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {doc.category}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter document title"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={newDocCategory} onValueChange={setNewDocCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collection_bucket">Collection Bucket</SelectItem>
                  <SelectItem value="next_actions">Next Actions</SelectItem>
                  <SelectItem value="strategy_toolbox">Strategy Toolbox</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDocument}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
