import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useReview } from '@/hooks/use-review';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Sidebar from '@/components/sidebar/Sidebar';
import { Separator } from '@/components/ui/separator';
import { Check, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function KolbLearningCycleForm() {
  const [formData, setFormData] = useState({
    isCycleFromPrevious: '',
    experience: '',
    marginalGain: '',
    eventsSequence: '',
    feelings: '',
    difficultAspects: '',
    challengeResponse: '',
    feelingTriggers: '',
    actingReasons: '',
    habits: '',
    similarPatterns: '',
    potentialSolutions: '',
    selectedExperiment: '',
    weeklyExperiment: '',
  });

  const [, setLocation] = useLocation();
  const [matchEdit, params] = useRoute('/reviews/form/experiential/edit/:id');
  const isEditMode = matchEdit && params?.id;
  
  // Import the useReview hook
  const { 
    addReview, 
    updateReview, 
    getReviewById,
    isLoading: isSaving 
  } = useReview();
  
  // Load review data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const reviewId = parseInt(params?.id || '0', 10);
      const reviewToEdit = getReviewById(reviewId);
      
      if (reviewToEdit) {
        // In a real implementation, we'd extract the form fields from the full content
        // For now, let's use the preview as an example
        const previewLines = reviewToEdit.preview.split('\n\n');
        
        setFormData(prevData => ({
          ...prevData,
          // Map preview parts to form fields - this is a simplified approach
          experience: previewLines[0] || '',
          habits: previewLines[1]?.replace('Gained insight: ', '') || '',
          potentialSolutions: previewLines[2]?.replace('Experiment: ', '') || '',
        }));
      }
    }
  }, [isEditMode, params, getReviewById]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create a preview from the form data
      const preview = `${formData.experience.slice(0, 50)}${formData.experience.length > 50 ? '...' : ''}
      
      Gained insight: ${formData.habits.slice(0, 100)}${formData.habits.length > 100 ? '...' : ''}
      
      Experiment: ${formData.potentialSolutions.slice(0, 100)}${formData.potentialSolutions.length > 100 ? '...' : ''}`;
      
      // Save review using the context
      if (isEditMode && params?.id) {
        // Update existing review
        const reviewId = parseInt(params.id, 10);
        await updateReview(reviewId, {
          preview,
          updatedAt: new Date(),
          // We could update the full form data as content here in a real implementation
        });
      } else {
        // Create new review
        await addReview({
          title: `Kolb's Learning Cycle - ${new Date().toLocaleDateString()}`,
          preview,
          type: 'experiential',
          // We could add the full form data as content here in a real implementation
        });
      }
      
      // Redirect back to the list
      setLocation('/document/category/reviews/experiential');
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
            {isEditMode ? 'Edit' : 'New'} Kolb's Experiential Learning Cycle
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Step 1: Experience / Behaviour</CardTitle>
                <CardDescription>
                  Reflect on a specific, recent experience that you want to analyze.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="isCycleFromPrevious" className="text-base font-medium">
                    Is this Kolb's cycle reflecting on an experiment from a previous Kolb's?*
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            Always cycle experiments from the previous Kolb's into your next one to ensure your marginal gains are compounding.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <RadioGroup
                    name="isCycleFromPrevious"
                    value={formData.isCycleFromPrevious}
                    onValueChange={(value) => handleSelectChange('isCycleFromPrevious', value)}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="cycle-yes" />
                      <Label htmlFor="cycle-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="cycle-no" />
                      <Label htmlFor="cycle-no">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-base font-medium">
                    What experience do you want to reflect on?*
                  </Label>
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    <p className="font-semibold mb-2">Guidelines for experience:</p>
                    <ul className="list-disc pl-5 space-y-1 text-gray-700">
                      <li><span className="font-medium">Process-focused</span> - avoid reflecting on outcomes as this is not a process.</li>
                      <li><span className="font-medium">Specific</span> - avoid reflecting on many events and activities, keep it focused.</li>
                      <li><span className="font-medium">Recent</span> - reflecting on experience that happened too long ago makes it easier to forget important parts.</li>
                      <li><span className="font-medium">Concise</span> - the experience is usually only one sentence as we will elaborate in the next steps.</li>
                    </ul>
                  </div>
                  <Textarea
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="min-h-24"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marginalGain" className="text-base font-medium">
                    What would a marginal gain look like?
                  </Label>
                  <div className="bg-gray-50 p-3 rounded-md text-sm mb-2">
                    <p className="text-gray-700">
                      Remember that marginal gains look different at different levels of the conscious competence model.
                      The marginal gain decides what you want to improve and the experiment at the end tells you how to improve it.
                    </p>
                  </div>
                  <Textarea
                    id="marginalGain"
                    name="marginalGain"
                    value={formData.marginalGain}
                    onChange={handleInputChange}
                    className="min-h-20"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Step 2: Reflection</CardTitle>
                <CardDescription>
                  Identify vulnerability factors and antecedents.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-3 rounded-md text-sm mb-2">
                  <p className="font-semibold mb-2">Difficulties with reflection:</p>
                  <p className="text-gray-700 mb-2">
                    If you struggle with reflecting deeply, it may indicate either a lack of practice or a lack of self-awareness during the experience itself. 
                    Your marginal gains will involve improving your self-awareness, while practicing these reflective questions to the best of your ability now.
                  </p>
                  <p className="text-gray-700 mb-2">
                    Many students who struggle with reflecting find that Kolb's takes too long (over 30 minutes) to complete. 
                    Just focus on completing as much as you can within 30 minutes. As your self-awareness improves, you will be able to complete this step faster.
                  </p>
                  <p className="text-gray-700">
                    Don't rush through to the next steps as your abstractions and experiments will be limited by the quality of your reflection. 
                    Take your time to improve this crucial skill!
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventsSequence" className="text-base font-medium">
                    List and describe the sequence of events, in chronological order*
                  </Label>
                  <Textarea
                    id="eventsSequence"
                    name="eventsSequence"
                    value={formData.eventsSequence}
                    onChange={handleInputChange}
                    className="min-h-24"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feelings" className="text-base font-medium">
                    How did you feel about the experience?*
                  </Label>
                  <div className="bg-gray-50 p-3 rounded-md text-sm mb-2">
                    <p className="text-gray-700">
                      Be specific and detailed about how you felt and when you felt this way. 
                      Heightened emotions often indicate key parts of the process that contributed to success or failure. 
                      For example, we can feel frustrated before we cognitively recognize which parts of the process make us feel that way.
                    </p>
                  </div>
                  <Textarea
                    id="feelings"
                    name="feelings"
                    value={formData.feelings}
                    onChange={handleInputChange}
                    className="min-h-24"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficultAspects" className="text-base font-medium">
                    Which aspects (if any) of the process felt especially difficult? Which aspects felt like they went well?*
                  </Label>
                  <Textarea
                    id="difficultAspects"
                    name="difficultAspects"
                    value={formData.difficultAspects}
                    onChange={handleInputChange}
                    className="min-h-24"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="challengeResponse" className="text-base font-medium">
                    How did you respond to challenges and difficulties during this process?
                  </Label>
                  <div className="bg-gray-50 p-3 rounded-md text-sm mb-2">
                    <p className="text-gray-700">
                      This could include mental or physical activities you used to try and overcome the issue. 
                      You may have tried to avoid, bypass, or retreat from the difficulty. Be specific and detailed. 
                      It's important to be honest with ourselves and reflect on how we truly responded, and not how we wish we would have. 
                      Skip this question if there were no difficulties.
                    </p>
                  </div>
                  <Textarea
                    id="challengeResponse"
                    name="challengeResponse"
                    value={formData.challengeResponse}
                    onChange={handleInputChange}
                    className="min-h-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feelingTriggers" className="text-base font-medium">
                    What were the triggers to you feeling the way you did?
                  </Label>
                  <div className="bg-gray-50 p-3 rounded-md text-sm mb-2">
                    <p className="text-gray-700">
                      Triggers are cues, signs, events, actions, or exposures that made you feel or act a certain way. 
                      For example, some people are triggered to procrastinate when they see a social media icon. 
                      You might be triggered to feel very uncomfortable while learning as soon as you realize there are many potential relationships to think about.
                    </p>
                  </div>
                  <Textarea
                    id="feelingTriggers"
                    name="feelingTriggers"
                    value={formData.feelingTriggers}
                    onChange={handleInputChange}
                    className="min-h-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actingReasons" className="text-base font-medium">
                    Why do you think you acted the way you did during this experience?*
                  </Label>
                  <div className="bg-gray-50 p-3 rounded-md text-sm mb-2">
                    <p className="text-gray-700">
                      This question challenges your metacognition (thinking about thinking). 
                      Instead of thinking about the events of what happened and how you felt during the experience, 
                      reflect on what emotions or thoughts drove you to act and feel the way you did. 
                      Rather than reflecting on "what", we should reflect on "why". 
                      This is different from triggers because triggers are often external.
                    </p>
                  </div>
                  <Textarea
                    id="actingReasons"
                    name="actingReasons"
                    value={formData.actingReasons}
                    onChange={handleInputChange}
                    className="min-h-24"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Step 3: Abstraction</CardTitle>
                <CardDescription>
                  Analyze and evaluate your reflection.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-3 rounded-md text-sm mb-2">
                  <p className="font-semibold mb-2">Guidelines for abstraction:</p>
                  <p className="text-gray-700 mb-2">
                    Your abstraction should be an analysis and evaluation of your reflection. 
                    You are examining your reflection for clues that help you understand the root causes for your actions and processes. 
                    This translates to your improvements being made at a root cause level, rather than a symptom level.
                  </p>
                  <p className="text-gray-700">
                    If you struggle to find trends and patterns in your reflection, it may be because:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Your reflection is too brief or too superficial: go back to add more information.</li>
                    <li>Your self-awareness is still not high enough: keep it in mind next time you have a similar experience.</li>
                    <li>You are not used to analyzing your reflections: do your best and you will quickly improve!</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="habits" className="text-base font-medium">
                    What habits, beliefs, and tendencies can you identify from your reflection that explains why you acted the way you did?*
                  </Label>
                  <div className="bg-gray-50 p-3 rounded-md text-sm mb-2">
                    <p className="text-gray-700">
                      For example: you may identify that whenever you feel overwhelmed, you tend to try and avoid challenges and revert to something easier and more comfortable.
                      Identifying these trends is important to create a possible solution that helps us in not only this experience, but other similar experiences in the future!
                    </p>
                  </div>
                  <Textarea
                    id="habits"
                    name="habits"
                    value={formData.habits}
                    onChange={handleInputChange}
                    className="min-h-24"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="similarPatterns" className="text-base font-medium">
                    Do you act or respond in similar ways in other parts of your life?
                  </Label>
                  <div className="bg-gray-50 p-3 rounded-md text-sm mb-2">
                    <p className="text-gray-700">
                      This can help you to identify the holistic impact of the habits and tendencies you found above.
                    </p>
                  </div>
                  <Textarea
                    id="similarPatterns"
                    name="similarPatterns"
                    value={formData.similarPatterns}
                    onChange={handleInputChange}
                    className="min-h-24"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Step 4: Experiment</CardTitle>
                <CardDescription>
                  Design actionable experiments to apply your learnings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-3 rounded-md text-sm mb-2">
                  <p className="font-semibold mb-2">Guidelines for experiment:</p>
                  <p className="text-gray-700 mb-2">
                    Keep your experiments concise, specific, and actionable.
                  </p>
                  <p className="text-gray-700 mb-2">
                    Avoid vague statements of intention. Imagine waking up tomorrow and seeing this list. 
                    You want to have a clear idea of exactly what you need to do to immediately act on your experiments.
                  </p>
                  <p className="text-gray-700">
                    Less than 3 experiments is ideal to improve your chances of success and make efficient progress with each cycle. 
                    More than 4 experiments is highly unadvised.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="potentialSolutions" className="text-base font-medium">
                    List some potential solutions and actions to experiment on.*
                  </Label>
                  <Textarea
                    id="potentialSolutions"
                    name="potentialSolutions"
                    value={formData.potentialSolutions}
                    onChange={handleInputChange}
                    className="min-h-24"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selectedExperiment" className="text-base font-medium">
                    Use your criteria to pick one
                  </Label>
                  <Textarea
                    id="selectedExperiment"
                    name="selectedExperiment"
                    value={formData.selectedExperiment}
                    onChange={handleInputChange}
                    className="min-h-20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weeklyExperiment" className="text-base font-medium">
                    Write it in Weekly Experiment, but if it has max 3 experiments
                  </Label>
                  <div className="bg-gray-50 p-3 rounded-md text-sm mb-2">
                    <p className="text-gray-700">
                      Move it to "to evaluate priority list" or prioritized list
                    </p>
                  </div>
                  <Textarea
                    id="weeklyExperiment"
                    name="weeklyExperiment"
                    value={formData.weeklyExperiment}
                    onChange={handleInputChange}
                    className="min-h-20"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" type="button" onClick={() => setLocation('/document/category/reviews/experiential')}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditMode ? 'Update' : 'Save'} Reflection
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </main>
    </div>
  );
}