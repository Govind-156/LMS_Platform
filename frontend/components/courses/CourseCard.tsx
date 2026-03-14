"use client";

import { useState } from "react";
import Link from "next/link";
import type { Subject } from "@/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DESCRIPTION_MAX_LENGTH = 120;
const DEFAULT_INSTRUCTOR = "AI Learning Platform";

/** If YouTube maxresdefault fails, fall back to hqdefault. */
function youtubeFallbackThumbnail(url: string | null): string | null {
  if (!url || !url.includes("img.youtube.com")) return null;
  return url.replace("/maxresdefault.jpg", "/hqdefault.jpg");
}

function truncate(str: string | null, max: number): string {
  if (!str) return "";
  if (str.length <= max) return str;
  return str.slice(0, max).trim() + "…";
}

interface CourseCardProps {
  course: Subject;
  lessonCount?: number;
  instructor?: string;
}

export function CourseCard({ course, lessonCount, instructor = DEFAULT_INSTRUCTOR }: CourseCardProps) {
  const [thumbErrored, setThumbErrored] = useState(false);
  const displayThumb =
    thumbErrored && course.thumbnail ? youtubeFallbackThumbnail(course.thumbnail) : course.thumbnail;
  const snippet = truncate(course.description, DESCRIPTION_MAX_LENGTH);
  const priceDisplay =
    course.price === 0
      ? "Free"
      : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(course.price);

  return (
    <Card className="group overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
      <Link href={`/courses/${course.id}`} className="block">
        <div className="aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
          {displayThumb ? (
            <img
              src={displayThumb}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setThumbErrored(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
              No image
            </div>
          )}
        </div>
        <CardContent className="p-5">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100 line-clamp-2 mb-1">
            {course.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{instructor}</p>
          {snippet && (
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">{snippet}</p>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-primary">{priceDisplay}</span>
            {lessonCount != null && (
              <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-5 pt-0">
          <Button variant="outline" className="w-full" asChild>
            <span>Enroll</span>
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
}
