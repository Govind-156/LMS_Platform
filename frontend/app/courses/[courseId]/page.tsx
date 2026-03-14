import { CourseDetailClient } from "./CourseDetailClient";

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = await params;
  return <CourseDetailClient courseId={courseId} />;
}
