import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { HomeCourses } from "@/components/home/HomeCourses";

const MOCK_LESSONS = [
  { label: "Lesson 01", value: 100 },
  { label: "Lesson 02", value: 65 },
  { label: "Lesson 03", value: 0 },
];

const STATS = [
  { value: "5k+", label: "Expert Courses" },
  { value: "4.7k", label: "Average Rating" },
  { value: "300k+", label: "Students" },
  { value: "100%", label: "Certification" },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 -z-10" />
      <div
        className="fixed -z-10 h-[600px] w-[600px] rounded-full bg-purple-500 opacity-[0.12] blur-[120px] -top-48 -right-48"
        aria-hidden
      />
      <div
        className="fixed -z-10 h-[500px] w-[500px] rounded-full bg-blue-500 opacity-[0.12] blur-[100px] bottom-0 left-1/4"
        aria-hidden
      />

      <Navbar />

      {/* Hero — two columns */}
      <section className="section-spacing">
        <div className="page-container flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          <div className="flex-1 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">
              LEARN AT YOUR OWN PACE
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
              Skills for your present
              <br />
              and your future
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-lg">
              Build deep product and engineering knowledge with structured courses and expert
              instructors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/courses">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-base shadow-lg shadow-primary/25"
                >
                  Browse Courses
                </Button>
              </Link>
              <Link href="/courses">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white"
                >
                  Show me
                </Button>
              </Link>
            </div>
          </div>

          {/* Floating course preview card */}
          <div className="flex-1 w-full max-w-md">
            <div className="rounded-2xl shadow-xl bg-white/5 border border-white/10 p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">
                Course preview
              </p>
              <div className="space-y-4">
                {MOCK_LESSONS.map((lesson) => (
                  <div key={lesson.label} className="space-y-2">
                    <p className="text-sm font-medium text-slate-200">{lesson.label}</p>
                    <Progress value={lesson.value} className="h-2 bg-slate-700" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-spacing border-t border-slate-800/80">
        <div className="page-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-700/60 bg-slate-900/40 backdrop-blur px-5 py-6 text-center"
              >
                <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Courses */}
      <section className="section-spacing border-t border-slate-800/80 bg-slate-950/40">
        <HomeCourses />
      </section>

      <footer className="border-t border-slate-800 py-10 mt-auto">
        <div className="page-container text-center text-sm text-slate-500">
          AI Learning Platform — courses with AI tutor
        </div>
      </footer>
    </main>
  );
}
