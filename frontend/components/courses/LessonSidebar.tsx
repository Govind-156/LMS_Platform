"use client";

import { CourseSidebar } from "./CourseSidebar";
import type { SubjectTreeSection } from "@/types";

/**
 * LessonSidebar: PRD name for the course curriculum sidebar on the learning page.
 * Renders sections and lessons with completed (checkmark) and locked (lock icon) states.
 * Links use /courses/[courseId]/lesson/[lessonId].
 */
export interface LessonSidebarProps {
  courseId: string;
  courseTitle: string;
  sections: SubjectTreeSection[];
  currentLessonId: number;
  orderedLessonIds: number[];
  isOpen?: boolean;
  onClose?: () => void;
}

export function LessonSidebar({
  courseId,
  courseTitle,
  sections,
  currentLessonId,
  orderedLessonIds,
  isOpen,
  onClose,
}: LessonSidebarProps) {
  return (
    <CourseSidebar
      courseId={courseId}
      courseTitle={courseTitle}
      sections={sections}
      currentVideoId={currentLessonId}
      orderedVideoIds={orderedLessonIds}
      isOpen={isOpen}
      onClose={onClose}
      lessonSegment="lesson"
    />
  );
}
