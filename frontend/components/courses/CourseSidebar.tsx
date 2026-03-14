"use client";

import Link from "next/link";
import { Check, Lock } from "lucide-react";
import type { SubjectTreeSection } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CourseSidebarProps {
  courseId: string;
  courseTitle: string;
  sections: SubjectTreeSection[];
  currentVideoId: number;
  orderedVideoIds: number[];
  isOpen?: boolean;
  onClose?: () => void;
  lessonSegment?: "video" | "lesson";
}

export function CourseSidebar({
  courseId,
  courseTitle,
  sections,
  currentVideoId,
  orderedVideoIds,
  isOpen = false,
  onClose,
  lessonSegment = "video",
}: CourseSidebarProps) {
  const currentIndex = orderedVideoIds.indexOf(currentVideoId);

  function isLocked(videoId: number): boolean {
    const idx = orderedVideoIds.indexOf(videoId);
    return idx > currentIndex;
  }

  function isCompleted(videoId: number): boolean {
    const idx = orderedVideoIds.indexOf(videoId);
    return idx < currentIndex;
  }

  const sidebarContent = (
    <>
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 shrink-0">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden flex items-center gap-2 body-muted hover:text-slate-900 dark:hover:text-white mb-2"
            aria-label="Close menu"
          >
            <span aria-hidden>←</span> Close
          </button>
        )}
        <Link
          href={`/courses/${courseId}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Course
        </Link>
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 mt-1.5 line-clamp-2 text-sm sm:text-base">
          {courseTitle}
        </h2>
      </div>
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <nav className="p-3">
          {sections.map((section) => (
            <div key={section.id} className="mb-4">
              <h3 className="label px-2 py-1.5">
                {section.title}
              </h3>
              <ul className="space-y-0.5">
                {section.videos.map((video) => {
                  const locked = isLocked(video.id);
                  const completed = isCompleted(video.id);
                  const isCurrent = video.id === currentVideoId;
                  const href = locked ? undefined : `/courses/${courseId}/${lessonSegment}/${video.id}`;
                  return (
                    <li key={video.id}>
                      {href ? (
                        <Link
                          href={href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                            isCurrent && "bg-primary/10 text-primary font-medium hover:bg-primary/15"
                          )}
                        >
                          {completed ? (
                            <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                          ) : locked ? (
                            <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                          ) : (
                            <span className="w-4 h-4 shrink-0 rounded-full border-2 border-primary bg-primary/20" />
                          )}
                          <span className="line-clamp-2">{video.title}</span>
                        </Link>
                      ) : (
                        <span
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 dark:text-slate-500 cursor-not-allowed"
                          aria-disabled
                        >
                          <Lock className="h-4 w-4 shrink-0" />
                          <span className="line-clamp-2">{video.title}</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </>
  );

  const isDrawer = typeof onClose === "function";

  if (isDrawer) {
    return (
      <>
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={onClose}
          aria-hidden
        />
        <aside
          className={cn(
            "w-72 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
            "fixed left-0 top-0 bottom-0 z-50 transition-transform duration-200 ease-out lg:relative lg:z-auto",
            isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
          aria-label="Lesson sidebar"
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  return (
    <aside
      className="w-72 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      aria-label="Lesson sidebar"
    >
      {sidebarContent}
    </aside>
  );
}
