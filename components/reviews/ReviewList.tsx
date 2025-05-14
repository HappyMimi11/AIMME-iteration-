import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar, Search, Edit, Trash2, Plus } from 'lucide-react';

// Types
export interface Review {
  id: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  preview: string;
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'experiential' | 'session';
  sessionId?: number; // Optional session ID to link reviews directly to sessions
}

interface ReviewListProps {
  reviews: Review[];
  title: string;
  description: string;
  formPath: string;
  onEditReview?: (id: number) => void;
  onDeleteReview?: (id: number) => void;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  title,
  description,
  formPath,
  onEditReview,
  onDeleteReview,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Filter reviews based on search query
  const filteredReviews = reviews.filter(
    (review) =>
      review.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditReview = (review: Review) => {
    if (onEditReview) {
      onEditReview(review.id);
    } else {
      // Default behavior: navigate to edit form
      setLocation(`${formPath}/edit/${review.id}`);
    }
  };

  const handleDeleteClick = (review: Review) => {
    setSelectedReview(review);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedReview && onDeleteReview) {
      onDeleteReview(selectedReview.id);
    }
    setDeleteDialogOpen(false);
  };

  const getReviewTypeLabel = (type: Review['type']) => {
    switch (type) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      case 'experiential':
        return 'Experiential';
      case 'session':
        return 'Session';
      default:
        return 'Review';
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </div>
        <Button onClick={() => setLocation(formPath)} className="flex items-center gap-2">
          <Plus size={16} />
          <span>New {title.replace('Reviews', '').trim()}</span>
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Search reviews..."
          className="pl-8 pr-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredReviews.length > 0 ? (
        <div className="space-y-3">
          {filteredReviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <div className="p-5 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-8 sm:col-span-9">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-lg">{review.title}</h3>
                    <Badge variant="outline" className="ml-2">
                      {getReviewTypeLabel(review.type)}
                    </Badge>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 gap-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(review.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    <span>·</span>
                    <span>Last updated: {format(new Date(review.updatedAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <div className="col-span-4 sm:col-span-3 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleEditReview(review)}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  {onDeleteReview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteClick(review)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium mb-1">No reviews found</h3>
          {searchQuery ? (
            <p className="text-gray-500 mb-4">No reviews match your search criteria</p>
          ) : (
            <p className="text-gray-500 mb-4">Get started by creating your first review</p>
          )}
          {!searchQuery && (
            <Button onClick={() => setLocation(formPath)} className="flex items-center gap-2">
              <Plus size={16} />
              <span>New {title.replace('Reviews', '').trim()}</span>
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedReview?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewList;