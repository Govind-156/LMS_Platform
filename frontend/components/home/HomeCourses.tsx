"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Subject } from "@/types";
import { CourseCard } from "@/components/courses/CourseCard";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export function HomeCourses() {
  const [courses, setCourses] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get<Subject[]>("/subjects")
      .then((res) => setCourses(res.data ?? []))
      .catch((err) => setError(getApiErrorMessage(err, "Failed to load courses")))
      .finally(() => setLoading(false));
  }, []);

  const count = courses.length;

  return (
    <div className="page-container section-spacing">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white dark:text-slate-100">
            All Courses
          </h2>
          <p className="text-slate-400 mt-1 text-sm">
            {loading ? "…" : error ? "Unable to load count." : `${count} course${count !== 1 ? "s" : ""} — new content added every month.`}
          </p>
        </div>
        {!loading && !error && count > 0 && (
          <Link href="/courses">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              View all
            </Button>
          </Link>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-slate-400">Loading courses…</p>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && count === 0 && (
        <p className="text-slate-400 text-sm">No courses available.</p>
      )}

      {!loading && !error && count > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.slice(0, 8).map((course) => (
            <CourseCard key={course.id} course={course} lessonCount={1} />
          ))}
        </div>
      )}
    </div>
  );
}
