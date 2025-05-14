import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useReview } from '@/hooks/use-review';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import Sidebar from '@/components/sidebar/Sidebar';
import { Calendar, CheckCircle2, HelpCircle, ListTodo, Clipboard } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function DailyReviewForm() {
  const today = new Date();
  const [formData, setFormData] = useState({
    title: `Daily Review - ${format(today, 'MMMM d, yyyy')}`,
    achievements: '',
    challenges: '',
    insights: '',
    wellbeing: '',
    tomorrow: '',
    gratitude: '',
  });

  const [, setLocation] = useLocation();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Import the useReview hook
  const { addReview, isLoading: isSaving } = useReview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create a preview from the form data
      const preview = `Achievements: ${formData.achievements.slice(0, 60)}${formData.achievements.length > 60 ? '...' : ''}
      
      Insights: ${formData.insights.slice(0, 60)}${formData.insights.length > 60 ? '...' : ''}
      
      Tomorrow: ${formData.tomorrow.slice(0, 60)}${formData.tomorrow.length > 60 ? '...' : ''}`;
      
      // Save review using the context
      await addReview({
        title: formData.title,
        preview,
        type: 'daily',
        // We could add the full form data as content here in a real implementation
      });
      
      // Redirect back to the list
      setLocation('/document/category/reviews/daily');
    } catch (error) {
      console.error('Error saving review:', error);
    }
  };

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#F8FAFC] p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Daily Review</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  {formData.title}
                </CardTitle>
                <CardDescription>
                  Reflect on your day and set intentions for tomorrow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-medium">
                    Review Title
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="achievements" className="text-base font-medium flex items-center">
                    What did you accomplish today?
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            List your wins, no matter how small. This builds a habit of celebrating progress.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Textarea
                    id="achievements"
                    name="achievements"
                    placeholder="List your accomplishments and progress..."
                    value={formData.achievements}
                    onChange={handleInputChange}
                    className="min-h-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="challenges" className="text-base font-medium flex items-center">
                    What challenges did you face?
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            Acknowledging challenges helps identify patterns and prepares you for tomorrow.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Textarea
                    id="challenges"
                    name="challenges"
                    placeholder="What difficulties or obstacles did you encounter?"
                    value={formData.challenges}
                    onChange={handleInputChange}
                    className="min-h-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insights" className="text-base font-medium flex items-center">
                    What did you learn today?
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            Capturing insights helps reinforce learning and builds your personal knowledge base.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Textarea
                    id="insights"
                    name="insights"
                    placeholder="Note any insights, lessons, or interesting discoveries..."
                    value={formData.insights}
                    onChange={handleInputChange}
                    className="min-h-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wellbeing" className="text-base font-medium flex items-center">
                    Wellbeing check-in
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            Regularly checking in on your physical and mental wellbeing helps maintain balance.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Textarea
                    id="wellbeing"
                    name="wellbeing"
                    placeholder="How are you feeling physically and mentally? Energy levels? Stress?"
                    value={formData.wellbeing}
                    onChange={handleInputChange}
                    className="min-h-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tomorrow" className="text-base font-medium flex items-center">
                    <div className="flex items-center">
                      Top priorities for tomorrow
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">
                              Limit to 3-5 key tasks to maintain focus. This primes your mind for tomorrow.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </Label>
                  <Textarea
                    id="tomorrow"
                    name="tomorrow"
                    placeholder="What are your top 3-5 priorities for tomorrow?"
                    value={formData.tomorrow}
                    onChange={handleInputChange}
                    className="min-h-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gratitude" className="text-base font-medium flex items-center">
                    Gratitude
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            Ending with gratitude has been shown to improve wellbeing and sleep quality.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Textarea
                    id="gratitude"
                    name="gratitude"
                    placeholder="What are you grateful for today?"
                    value={formData.gratitude}
                    onChange={handleInputChange}
                    className="min-h-20"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" type="button" onClick={() => setLocation('/document/category/reviews/daily')}>
                  Cancel
                </Button>
                <Button type="submit">Save Review</Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </main>
    </div>
  );
}