import React from 'react';
import Sidebar from '@/components/sidebar/Sidebar';
import ReviewList, { Review } from '@/components/reviews/ReviewList';

// Start with empty reviews array, will be populated from API
const demoReviews: Review[] = [];

export default function WeeklyReviewList() {
  const handleDeleteReview = (id: number) => {
    console.log(`Delete review ${id}`);
    // Here you would make an API call to delete the review
  };

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-[#F8FAFC] p-6">
        <ReviewList
          reviews={demoReviews}
          title="Weekly Reviews"
          description="Review your week, set priorities, and track longer-term patterns"
          formPath="/reviews/form/weekly"
          onDeleteReview={handleDeleteReview}
        />
      </main>
    </div>
  );
}