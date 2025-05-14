import React from 'react';
import Sidebar from '@/components/sidebar/Sidebar';
import ReviewList, { Review } from '@/components/reviews/ReviewList';

// Start with empty reviews array, will be populated from API
const demoReviews: Review[] = [];

export default function YearlyReviewList() {
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
          title="Yearly Reviews"
          description="Reflect on your year, celebrate achievements, and set directions for the future"
          formPath="/reviews/form/yearly"
          onDeleteReview={handleDeleteReview}
        />
      </main>
    </div>
  );
}