"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { EnrolledCourseCard, type EnrolledCourseItem } from "@/components/courses/EnrolledCourseCard";
import { Navbar } from "@/components/layout/Navbar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Award, Download } from "lucide-react";
import type { Certificate } from "@/types";

interface EnrolledCourseWithProgress extends EnrolledCourseItem {
  progress?: { completed: number; total: number } | null;
}

export function ProfileContent() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [courses, setCourses] = useState<EnrolledCourseWithProgress[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certsLoading, setCertsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const loadEnrolledCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<EnrolledCourseItem[]>("/users/me/courses");
      const withProgress = await Promise.all(
        (data ?? []).map(async (course) => {
          try {
            const { data: progress } = await api.get<{ completed: number; total: number }>(
              `/progress/subjects/${course.id}`
            );
            return { ...course, progress: progress ?? null };
          } catch {
            return { ...course, progress: null };
          }
        })
      );
      setCourses(withProgress);
    } catch {
      setError("Failed to load your courses.");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCertificates = useCallback(async () => {
    setCertsLoading(true);
    try {
      const { data } = await api.get<Certificate[]>("/certificates");
      setCertificates(data ?? []);
    } catch {
      setCertificates([]);
    } finally {
      setCertsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEnrolledCourses();
  }, [loadEnrolledCourses]);

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  async function handleDownloadCertificate(cert: Certificate) {
    setDownloadingId(cert.id);
    try {
      const { data } = await api.get<Blob>(`/certificates/${cert.id}/download`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${cert.course_title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  }

  function formatCertDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="page-container page-content">
        <div className="section-gap">
          <div>
            <h1 className="heading-page mb-2">Profile</h1>
            {user && (
              <Card className="mt-4 rounded-xl border-slate-200 dark:border-slate-800">
                <CardContent className="flex items-center gap-4 p-6">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                      {user.name?.slice(0, 2).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                    <p className="body-muted truncate">{user.email}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <h2 className="heading-section mb-4">My courses</h2>
            {loading && (
              <div className="flex flex-col items-center py-16 gap-4">
                <LoadingSpinner size="lg" />
                <p className="body-muted">Loading your courses…</p>
              </div>
            )}
            {error && (
              <ErrorMessage message={error} onRetry={loadEnrolledCourses} className="max-w-md" />
            )}
            {!loading && !error && courses.length === 0 && (
              <Card className="rounded-xl border-slate-200 dark:border-slate-800">
                <CardContent className="p-8 text-center">
                  <p className="body mb-6">You haven&apos;t enrolled in any courses yet.</p>
                  <Button asChild>
                    <Link href="/courses">Browse courses</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
            {!loading && courses.length > 0 && (
              <ul className="space-y-4">
                {courses.map((course) => (
                  <li key={course.id}>
                    <EnrolledCourseCard course={course} progress={course.progress} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="heading-section mb-4">My Certificates</h2>
            {certsLoading && (
              <div className="flex flex-col items-center py-8 gap-4">
                <LoadingSpinner />
                <p className="body-muted text-sm">Loading certificates…</p>
              </div>
            )}
            {!certsLoading && certificates.length === 0 && (
              <Card className="rounded-xl border-slate-200 dark:border-slate-800">
                <CardContent className="p-8 text-center">
                  <Award className="h-10 w-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                  <p className="body-muted">No certificates yet. Complete a course to earn your first certificate.</p>
                  <Button asChild className="mt-4">
                    <Link href="/courses">Browse courses</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
            {!certsLoading && certificates.length > 0 && (
              <ul className="space-y-4">
                {certificates.map((cert) => (
                  <li key={cert.id}>
                    <Card className="rounded-xl border-slate-200 dark:border-slate-800 overflow-hidden">
                      <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {cert.course_title}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Completed {formatCertDate(cert.issued_at)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 inline-flex items-center gap-2"
                          onClick={() => handleDownloadCertificate(cert)}
                          disabled={downloadingId === cert.id}
                        >
                          <Download className="h-4 w-4" />
                          {downloadingId === cert.id ? "Preparing…" : "Download"}
                        </Button>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild>
            <Link href="/courses">Browse courses</Link>
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Log out
          </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
