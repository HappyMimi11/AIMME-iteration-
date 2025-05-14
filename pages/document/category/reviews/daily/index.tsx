import React from 'react';
import Sidebar from '@/components/sidebar/Sidebar';
import ReviewList from '@/components/reviews/ReviewList';
import { useReview } from '@/hooks/use-review';

export default function DailyReviewList() {
  const { getReviewsByType, deleteReview } = useReview();
  
  // Get only daily type reviews
  const dailyReviews = getReviewsByType('daily');

  const handleDeleteReview = async (id: number) => {
    try {
      await deleteReview(id);
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#F8FAFC] p-6">
        <ReviewList
          reviews={dailyReviews}
          title="Daily Reviews"
          description="Track your daily progress, achievements, and intentions"
          formPath="/reviews/form/daily"
          onDeleteReview={handleDeleteReview}
        />
      </main>
    </div>
  );
}