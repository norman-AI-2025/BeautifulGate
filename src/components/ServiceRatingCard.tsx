'use client';

import React, { useState } from 'react';
import { Star, CheckCircle, Send, Heart } from 'lucide-react';
import { TransitBooking } from '@/types';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

interface ServiceRatingCardProps {
  booking: TransitBooking;
}

export const ServiceRatingCard: React.FC<ServiceRatingCardProps> = ({ booking }) => {
  const { rateBooking } = useApp();
  const { t } = useLanguage();

  const [rating, setRating] = useState<number>(booking.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>(booking.feedback || '');
  const [submitted, setSubmitted] = useState<boolean>(Boolean(booking.rating));

  const quickTags = [
    { key: 'rating.tagPunctual', defaultLabel: 'Punctual Arrival' },
    { key: 'rating.tagClamp', defaultLabel: 'Gentle Clamp Securing' },
    { key: 'rating.tagLift', defaultLabel: 'Hydraulic Lift Care' },
    { key: 'rating.tagPatient', defaultLabel: 'Patient & Friendly' },
    { key: 'rating.tagSmooth', defaultLabel: 'Smooth Transit' },
  ];

  const handleTagClick = (tagLabel: string) => {
    if (comment.includes(tagLabel)) return;
    setComment(prev => (prev ? `${prev}, ${tagLabel}` : tagLabel));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rateBooking(booking.id, rating, comment);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/70 p-5 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
          <CheckCircle className="h-5 w-5" />
        </div>
        <h4 className="text-sm font-bold text-emerald-950 mt-2">
          {t('rating.thankYou', 'Thank you for your feedback!')}
        </h4>
        <div className="flex items-center justify-center gap-1 my-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= (booking.rating || rating)
                  ? 'fill-amber-400 text-amber-500'
                  : 'text-neutral-300'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-emerald-800 font-medium">
          {t('rating.thankYouDetail', 'Your rating of Driver Johan has been recorded and submitted to Beautiful Gate administration.')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50/90 to-orange-50/50 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-amber-200/80">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Heart className="h-3.5 w-3.5 fill-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-900 leading-tight">
              {t('rating.serviceTitle', 'Rate Your Completed Transit Service')}
            </h4>
            <p className="text-[11px] text-neutral-600 font-medium">
              {t('rating.driverLabel', 'Driver')}: {booking.assigned_driver || 'Assigned Driver'} · {booking.assigned_vehicle?.plate || 'WVV 4108'}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
          {t('rating.beneficiaryReview', 'Beneficiary Review')}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
        {/* Star Rating Selector */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= (hoverRating || rating);
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-125 tap-target"
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      isFilled
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-neutral-300'
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <span className="text-xs font-bold text-amber-900 mt-1">
            {rating === 5 && t('rating.rating5', 'Excellent & Very Caring')}
            {rating === 4 && t('rating.rating4', 'Good & Punctual')}
            {rating === 3 && t('rating.rating3', 'Satisfactory Service')}
            {rating === 2 && t('rating.rating2', 'Needs Improvement')}
            {rating === 1 && t('rating.rating1', 'Unsatisfactory')}
          </span>
        </div>

        {/* Quick Feedback Tags */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {quickTags.map((tagObj) => {
            const tagLabel = t(tagObj.key, tagObj.defaultLabel);
            return (
              <button
                key={tagObj.key}
                type="button"
                onClick={() => handleTagClick(tagLabel)}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-300 bg-white hover:bg-amber-100 text-amber-900 transition-colors"
              >
                + {tagLabel}
              </button>
            );
          })}
        </div>

        {/* Comment Textarea */}
        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('rating.commentPlaceholder', 'Share your appreciation or feedback for Driver Johan and vehicle care...')}
          className="w-full text-xs rounded-xl border border-amber-300 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900 placeholder:text-neutral-400"
        />

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all tap-target"
        >
          <Send className="h-3.5 w-3.5" />
          {t('rating.submitBtn', 'Submit Service Rating')}
        </button>
      </form>
    </div>
  );
};
