"use client";

import { VideoPageContent } from "../../video/[videoId]/VideoPageContent";

interface LessonPageContentProps {
  courseId: string;
  lessonId: string;
}

/**
 * Lesson page content: same layout as video page but uses /lesson/ routes.
 * Sidebar and prev/next links point to /courses/[courseId]/lesson/[lessonId].
 */
export function LessonPageContent({ courseId, lessonId }: LessonPageContentProps) {
  return <VideoPageContent courseId={courseId} videoId={lessonId} basePath="lesson" />;
}
