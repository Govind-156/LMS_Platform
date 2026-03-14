"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface EnrolledCourseItem {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  thumbnail: string | null;
}

interface EnrolledCourseCardProps {
  course: EnrolledCourseItem;
  progress?: { completed: number; total: number } | null;
}

export function EnrolledCourseCard({ course, progress }: EnrolledCourseCardProps) {
  const progressText =
    progress && progress.total > 0
      ? `${progress.completed} of ${progress.total} lessons completed`
      : null;

  return (
    <Card className="overflow-hidden rounded-xl border-slate-200 dark:border-slate-800 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <Link href={`/courses/${course.id}/learn`} className="block">
        <div className="flex">
          <div className="w-32 shrink-0 aspect-video bg-slate-100 dark:bg-slate-800">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                No image
              </div>
            )}
          </div>
          <CardContent className="flex-1 min-w-0 p-5 flex flex-col justify-center">
            <h2 className="heading-card line-clamp-2">{course.title}</h2>
            {progressText && (
              <p className="body-muted mt-1.5">{progressText}</p>
            )}
            <Button variant="link" className="p-0 h-auto text-primary mt-2 font-medium w-fit">
              View course →
            </Button>
          </CardContent>
        </div>
      </Link>
    </Card>
  );
}
