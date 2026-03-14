"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import type { SubjectTree } from "@/types";

/**
 * Learn page: enforces enrollment, then redirects to first lesson.
 * If not enrolled → redirect to course detail page.
 * If enrolled → redirect to /courses/[courseId]/lesson/[firstLessonId].
 */
function LearnPageContent() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.courseId as string;
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!courseId) return;
    if (!accessToken) {
      router.replace(`/courses/${courseId}`);
      return;
    }
    Promise.all([
      api.get<{ id: number }[]>("/users/me/courses"),
      api.get<SubjectTree>(`/subjects/${courseId}/tree`),
    ])
      .then(([enrolledRes, treeRes]) => {
        const enrolled = (enrolledRes.data ?? []).some((c) => String(c.id) === courseId);
        if (!enrolled) {
          router.replace(`/courses/${courseId}`);
          return;
        }
        const tree = treeRes.data;
        const firstVideoId = tree?.sections?.[0]?.videos?.[0]?.id;
        if (firstVideoId != null) {
          router.replace(`/courses/${courseId}/lesson/${firstVideoId}`);
        } else {
          router.replace(`/courses/${courseId}`);
        }
      })
      .catch(() => {
        router.replace(`/courses/${courseId}`);
      });
  }, [courseId, accessToken, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 py-20 px-4">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Taking you to the course…</p>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">You’ll see the video player and lesson list in a moment.</p>
    </main>
  );
}

export default function LearnPage() {
  return (
    <ProtectedRoute>
      <LearnPageContent />
    </ProtectedRoute>
  );
}
