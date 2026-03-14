"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Subject } from "@/types";
import { CourseCard } from "@/components/courses/CourseCard";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = () => {
    setLoading(true);
    setError(null);
    api
      .get<Subject[]>("/subjects")
      .then((res) => setCourses(res.data ?? []))
      .catch((err) => setError(getApiErrorMessage(err, "Failed to load courses")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCourses();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <div className="page-container section-spacing">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1.5">
              All Courses
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {!loading && !error && courses.length > 0
                ? `${courses.length} course${courses.length !== 1 ? "s" : ""} — new content added every month.`
                : "Choose a course to start learning."}
            </p>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-slate-500">Loading courses…</p>
            </div>
          )}

          {error && (
            <ErrorMessage message={error} onRetry={loadCourses} className="max-w-md" />
          )}

          {!loading && !error && courses.length === 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center shadow-md">
              <p className="text-slate-600 dark:text-slate-400 mb-6">No courses available.</p>
              <Button asChild>
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          )}

          {!loading && !error && courses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} lessonCount={1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
