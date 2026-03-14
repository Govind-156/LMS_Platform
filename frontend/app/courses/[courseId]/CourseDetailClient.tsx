"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Subject, SubjectTree } from "@/types";
import { PaymentModal } from "@/components/payment/PaymentModal";
import { usePaymentStore } from "@/store/paymentStore";
import { useAuthStore } from "@/store/authStore";
import { Navbar } from "@/components/layout/Navbar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { extractYouTubeVideoId } from "@/lib/youtube";
import {
  ChevronDown,
  ChevronUp,
  Lock,
  Play,
  Clock,
  BookOpen,
  Award,
  Infinity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseDetailClientProps {
  courseId: string;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} min`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m} min`;
  return `${m} min ${s} sec`;
}

function formatTotalDuration(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)} min total`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (m === 0) return `${h} hour${h !== 1 ? "s" : ""}`;
  return `${h}h ${m}m`;
}

export function CourseDetailClient({ courseId }: CourseDetailClientProps) {
  const router = useRouter();
  const [course, setCourse] = useState<Subject | null>(null);
  const [tree, setTree] = useState<SubjectTree | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);

  const refetchEnrollment = useCallback(() => {
    if (!courseId) return;
    api
      .get<Array<{ id: number }>>("/users/me/courses")
      .then((res) => {
        const enrolled = (res.data ?? []).some((c) => String(c.id) === courseId);
        setIsEnrolled(enrolled);
      })
      .catch(() => setIsEnrolled(false));
  }, [courseId]);

  const handlePaymentSuccess = useCallback(() => {
    refetchEnrollment();
    router.push(`/courses/${courseId}/learn`);
  }, [courseId, router, refetchEnrollment]);

  const loadCourse = useCallback(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      api.get<Subject>(`/subjects/${courseId}`),
      api.get<SubjectTree>(`/subjects/${courseId}/tree`),
    ])
      .then(([courseRes, treeRes]) => {
        setCourse(courseRes.data);
        setTree(treeRes.data);
      })
      .catch(() => setError("Failed to load course"))
      .finally(() => setLoading(false));
  }, [courseId]);

  const totalLessons =
    tree?.sections?.reduce((acc, s) => acc + (s.videos?.length ?? 0), 0) ?? 0;
  const totalSeconds =
    tree?.sections?.reduce(
      (acc, s) =>
        acc + (s.videos?.reduce((a, v) => a + (v.duration_seconds ?? 0), 0) ?? 0),
      0
    ) ?? 0;
  const firstVideo = tree?.sections?.[0]?.videos?.[0];
  const previewYoutubeId = firstVideo?.youtube_url
    ? extractYouTubeVideoId(firstVideo.youtube_url)
    : null;

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  useEffect(() => {
    if (!accessToken) {
      setIsEnrolled(false);
      return;
    }
    refetchEnrollment();
  }, [accessToken, refetchEnrollment]);

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner size="lg" />
        <p className="mt-4 body-muted">Loading course…</p>
      </main>
    );
  }

  if (error || !course) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="page-container page-content">
          <ErrorMessage
            message={error ?? "Course not found"}
            onRetry={loadCourse}
            className="max-w-md"
          />
          <Link href="/courses" className="mt-6 inline-block">
            <Button variant="outline">Back to courses</Button>
          </Link>
        </div>
      </main>
    );
  }

  const priceDisplay =
    course.price === 0
      ? "Free"
      : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
          course.price
        );

  const courseIncludes = [
    { label: `${totalLessons} lesson${totalLessons !== 1 ? "s" : ""}`, icon: BookOpen },
    { label: formatTotalDuration(totalSeconds), icon: Clock },
    { label: "Full lifetime access", icon: Infinity },
    { label: "Certificate of completion", icon: Award },
  ];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <PaymentModal onSuccess={handlePaymentSuccess} />

      {/* Back link */}
      <div className="page-container pt-4 pb-2">
        <Link
          href="/courses"
          className="body-muted hover:text-slate-900 dark:hover:text-slate-100 transition inline-flex items-center gap-1"
        >
          ← Back to courses
        </Link>
      </div>

      {/* Dark hero */}
      <section className="bg-slate-900 dark:bg-slate-950 border-y border-slate-800">
        <div className="page-container py-8 sm:py-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
            {course.title}
          </h1>
          <p className="text-slate-400 text-lg mb-4 max-w-2xl">
            {course.description?.slice(0, 120) || "Learn at your own pace with video lessons."}
            {course.description && course.description.length > 120 ? "…" : ""}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <span className="text-amber-400">★★★★☆</span>
              <span>4.6 (— ratings)</span>
            </span>
            <span>Instructor: AI Learning Platform</span>
          </div>
        </div>
      </section>

      <div className="page-container py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* Left column: description, curriculum, instructor */}
          <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
            {/* Purchase card on mobile: show above main content */}
            <div className="lg:hidden">
              <PurchaseCard
                course={course}
                courseId={courseId}
                isEnrolled={isEnrolled}
                priceDisplay={priceDisplay}
                previewYoutubeId={previewYoutubeId}
                totalLessons={totalLessons}
                courseIncludes={courseIncludes}
              />
            </div>

            {/* Description */}
            {course.description && (
              <div>
                <h2 className="heading-section mb-3">Description</h2>
                <p className="body whitespace-pre-wrap">{course.description}</p>
              </div>
            )}

            {/* Curriculum accordion */}
            {tree && tree.sections.length > 0 && (
              <div>
                <h2 className="heading-section mb-4">Curriculum</h2>
                <Card className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-lg">
                  {tree.sections.map((section, sectionIndex) => (
                    <CurriculumSection
                      key={section.id}
                      section={section}
                      sectionIndex={sectionIndex}
                      isEnrolled={isEnrolled}
                      courseId={courseId}
                    />
                  ))}
                </Card>
              </div>
            )}

            {/* Instructor */}
            <div>
              <h2 className="heading-section mb-4">Instructor</h2>
              <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 transition-all hover:shadow-lg">
                <div className="flex flex-wrap items-start gap-4">
                  <Avatar className="h-14 w-14 rounded-full border-2 border-slate-200 dark:border-slate-700">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                      AL
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      AI Learning Platform
                    </h3>
                    <p className="body-muted mt-1">
                      Courses designed to help you learn with video lessons and an AI tutor. Enroll
                      once and get lifetime access.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Right column: sticky purchase card (desktop only in layout) */}
          <div className="lg:col-span-1 order-1 lg:order-2 hidden lg:block">
            <div className="sticky top-24">
              <PurchaseCard
                course={course}
                courseId={courseId}
                isEnrolled={isEnrolled}
                priceDisplay={priceDisplay}
                previewYoutubeId={previewYoutubeId}
                totalLessons={totalLessons}
                courseIncludes={courseIncludes}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function PurchaseCard({
  course,
  courseId,
  isEnrolled,
  priceDisplay,
  previewYoutubeId,
  totalLessons,
  courseIncludes,
}: {
  course: Subject;
  courseId: string;
  isEnrolled: boolean;
  priceDisplay: string;
  previewYoutubeId: string | null;
  totalLessons: number;
  courseIncludes: Array<{ label: string; icon: React.ElementType }>;
}) {
  return (
    <Card className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
      {previewYoutubeId ? (
        <div className="aspect-video rounded-t-xl overflow-hidden bg-slate-900">
          <iframe
            src={`https://www.youtube.com/embed/${previewYoutubeId}`}
            title="Course preview"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="aspect-video rounded-t-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
          <Play className="h-12 w-12 text-slate-400" />
        </div>
      )}
      <CardContent className="p-6 space-y-5">
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{priceDisplay}</p>
        </div>
        {!isEnrolled ? (
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              usePaymentStore.getState().openModal({
                subjectId: course.id,
                title: course.title,
                price: course.price,
              });
            }}
          >
            Enroll Now
          </Button>
        ) : (
          <Button className="w-full" size="lg" asChild>
            <Link href={`/courses/${courseId}/learn`}>Go to course</Link>
          </Button>
        )}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
            This course includes
          </h4>
          <ul className="space-y-2">
            {courseIncludes.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <item.icon className="h-4 w-4 shrink-0 text-primary" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function CurriculumSection({
  section,
  sectionIndex,
  isEnrolled,
  courseId,
}: {
  section: SubjectTree["sections"][0];
  sectionIndex: number;
  isEnrolled: boolean;
  courseId: string;
}) {
  const [open, setOpen] = useState(sectionIndex === 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "border-slate-200 dark:border-slate-800",
          sectionIndex > 0 && "border-t"
        )}
      >
        <CollapsibleTrigger className="w-full px-6 py-4 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {section.title}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {section.videos.length} lesson{section.videos.length !== 1 ? "s" : ""}
          </span>
          {open ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="pb-4 px-6">
            {section.videos.map((video) => {
              const duration = formatDuration(video.duration_seconds || 0);
              const locked = !isEnrolled;
              return (
                <li key={video.id} className="flex items-center gap-3 py-2">
                  {locked ? (
                    <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                  ) : (
                    <Play className="h-4 w-4 shrink-0 text-primary" />
                  )}
                  {locked ? (
                    <span className="body-muted flex-1">
                      {video.title} – {duration}
                    </span>
                  ) : (
                    <Link
                      href={`/courses/${courseId}/lesson/${video.id}`}
                      className="body-muted hover:text-slate-900 dark:hover:text-slate-100 flex-1 transition-colors"
                    >
                      {video.title} – {duration}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
