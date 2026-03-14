import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LessonPageContent } from "./LessonPageContent";

interface LessonPageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseId, lessonId } = await params;
  return (
    <ProtectedRoute>
      <LessonPageContent courseId={courseId} lessonId={lessonId} />
    </ProtectedRoute>
  );
}
