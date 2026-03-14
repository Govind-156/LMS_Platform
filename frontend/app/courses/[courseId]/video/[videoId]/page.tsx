import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { VideoPageContent } from "./VideoPageContent";

interface VideoPageProps {
  params: Promise<{ courseId: string; videoId: string }>;
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { courseId, videoId } = await params;
  return (
    <ProtectedRoute>
      <VideoPageContent courseId={courseId} videoId={videoId} />
    </ProtectedRoute>
  );
}
