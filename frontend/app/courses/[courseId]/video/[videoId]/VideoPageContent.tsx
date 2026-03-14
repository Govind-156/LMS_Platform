"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { CourseSidebar } from "@/components/courses/CourseSidebar";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Menu, ChevronRight } from "lucide-react";
import type { SubjectTree } from "@/types";

interface VideoDetail {
  id: number;
  title: string;
  description: string | null;
  youtube_url: string;
  duration_seconds: number;
  section_id: number;
  section_title: string;
  subject_id: number;
  subject_title: string;
  previous_video_id: number | null;
  next_video_id: number | null;
  locked: boolean;
}

interface VideoPageContentProps {
  courseId: string;
  videoId: string;
  basePath?: "video" | "lesson";
}

export function VideoPageContent({ courseId, videoId, basePath = "video" }: VideoPageContentProps) {
  const segment = basePath === "lesson" ? "lesson" : "video";
  const router = useRouter();
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [tree, setTree] = useState<SubjectTree | null>(null);
  const [progress, setProgress] = useState<{ last_position_seconds: number; is_completed: boolean } | null>(null);
  const [courseProgress, setCourseProgress] = useState<{ completed: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const id = videoId;
    if (!id) {
      setLoading(false);
      return;
    }
    api
      .get<VideoDetail>(`/videos/${id}`)
      .then((res) => {
        setVideo(res.data);
        const data = res.data;
        if (data?.subject_id) {
          return Promise.all([
            api.get<SubjectTree>(`/subjects/${data.subject_id}/tree`).then((r) => r.data),
            api.get<{ completed: number; total: number }>(`/progress/subjects/${data.subject_id}`).then((r) => r.data),
          ]).then(([treeData, progressData]) => {
            if (treeData) setTree(treeData);
            if (progressData) setCourseProgress(progressData);
          }).catch(() => {});
        }
      })
      .catch((err: { response?: { status?: number } }) => {
        if (err.response?.status === 403 || err.response?.status === 404) {
          setAccessError("redirect");
        } else {
          setAccessError("error");
        }
      })
      .finally(() => setLoading(false));
  }, [videoId]);

  useEffect(() => {
    if (accessError !== "redirect") return;
    router.replace(`/courses/${courseId}`);
  }, [accessError, courseId, router]);

  useEffect(() => {
    if (!videoId) return;
    api
      .get<{ last_position_seconds: number; is_completed: boolean }>(`/progress/videos/${videoId}`)
      .then((res) => setProgress(res.data))
      .catch(() => setProgress({ last_position_seconds: 0, is_completed: false }));
  }, [videoId]);

  const orderedVideoIds = useMemo(() => {
    if (!tree?.sections) return [];
    const ids: number[] = [];
    for (const section of tree.sections) {
      for (const v of section.videos) {
        ids.push(v.id);
      }
    }
    return ids;
  }, [tree]);

  const handlePlayNext = useCallback(
    (nextId: number) => {
      router.push(`/courses/${courseId}/${segment}/${nextId}`);
    },
    [courseId, segment, router]
  );

  const refetchCourseProgress = useCallback(() => {
    if (!video?.subject_id) return;
    api
      .get<{ completed: number; total: number }>(`/progress/subjects/${video.subject_id}`)
      .then((res) => setCourseProgress(res.data))
      .catch(() => {});
  }, [video?.subject_id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-slate-500">Loading lesson…</p>
        </div>
      </div>
    );
  }

  if (accessError === "redirect") {
    return null;
  }

  if (accessError || !video) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="page-container section-spacing">
          <ErrorMessage
            message={accessError === "error" ? "Failed to load lesson." : "Lesson not found."}
            className="max-w-md"
          />
          <Link href={`/courses/${courseId}`}>
            <Button variant="outline" className="mt-6">Back to course</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (video.locked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="page-container section-spacing">
          <Card className="max-w-md p-6 rounded-xl shadow-md">
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Complete the previous lesson to unlock this one.
            </p>
            <Button asChild>
              <Link href={`/courses/${courseId}`}>Back to course</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const initialPosition = progress?.last_position_seconds ?? 0;
  const duration = video.duration_seconds || 1;
  const lessonProgressPercent = Math.min(
    100,
    Math.round(((progress?.last_position_seconds ?? 0) / duration) * 100)
  );
  const courseProgressPercent =
    courseProgress && courseProgress.total > 0
      ? Math.round((courseProgress.completed / courseProgress.total) * 100)
      : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      {/* Three-column layout: Lesson sidebar | Video player | AI tutor chat */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Lesson sidebar (scrollable) */}
        {tree && (
          <CourseSidebar
            courseId={courseId}
            courseTitle={video.subject_title}
            sections={tree.sections}
            currentVideoId={video.id}
            orderedVideoIds={orderedVideoIds}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            lessonSegment={segment}
          />
        )}
        {/* Middle + Right: Video area and AI chat */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <header className="shrink-0 flex items-center gap-4 px-4 py-3 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open lesson list"
            >
              <Menu className="h-4 w-4" />
            </Button>
            {courseProgress && courseProgress.total > 0 && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Course progress
                </p>
                <div className="flex items-center gap-3">
                  <Progress value={courseProgressPercent} className="h-2 flex-1" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 tabular-nums shrink-0">
                    {courseProgressPercent}%
                  </span>
                </div>
              </div>
            )}
          </header>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-0 min-h-0">
            {/* Middle: Video player + lesson title, description, progress, next button */}
            <div className="flex-1 min-w-0 flex flex-col gap-5 p-4 sm:p-6 overflow-auto">
              <Card className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
                <VideoPlayer
                  videoId={video.id}
                  youtubeUrl={video.youtube_url}
                  initialPositionSeconds={initialPosition}
                  nextVideoId={video.next_video_id}
                  onPlayNext={handlePlayNext}
                  onCompleted={refetchCourseProgress}
                  courseId={courseId}
                  className="w-full"
                />
              </Card>
              <div className="space-y-4">
                {video.section_title && (
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {video.section_title}
                  </p>
                )}
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {video.title}
                </h1>
                {video.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                    {video.description}
                  </p>
                )}
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Lesson progress
                  </p>
                  <div className="flex items-center gap-3">
                    <Progress value={lessonProgressPercent} className="h-2 flex-1" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 tabular-nums shrink-0">
                      {lessonProgressPercent}%
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  {video.previous_video_id != null && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/courses/${courseId}/${segment}/${video.previous_video_id}`}>
                        Previous lesson
                      </Link>
                    </Button>
                  )}
                  {video.next_video_id != null && (
                    <Button size="sm" asChild>
                      <Link href={`/courses/${courseId}/${segment}/${video.next_video_id}`} className="inline-flex items-center gap-1">
                        Next lesson
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {/* Right: AI tutor chat */}
            <div className="w-full lg:w-[380px] lg:min-w-0 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col min-h-[340px] lg:min-h-0 bg-white dark:bg-slate-900/50">
              <AIChatPanel
                videoId={video.id}
                videoTitle={video.title}
                className="flex-1 min-h-[300px] lg:min-h-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
