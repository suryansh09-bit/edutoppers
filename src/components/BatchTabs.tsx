"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Subject, Teacher, BatchDetail } from "@/lib/types";

interface BatchTabsProps {
  batchDetail: BatchDetail;
}

/* ─── Color helpers ─────────────────────────────────────────────────────── */
const PALETTES = [
  { from: "#6366f1", to: "#8b5cf6", badge: "#e0e7ff", badgeText: "#3730a3" },
  { from: "#ec4899", to: "#f43f5e", badge: "#ffe4e6", badgeText: "#9f1239" },
  { from: "#10b981", to: "#059669", badge: "#dcfce7", badgeText: "#166534" },
  { from: "#f59e0b", to: "#ef4444", badge: "#fef3c7", badgeText: "#92400e" },
  { from: "#0ea5e9", to: "#6366f1", badge: "#e0f2fe", badgeText: "#075985" },
  { from: "#8b5cf6", to: "#ec4899", badge: "#f5f3ff", badgeText: "#5b21b6" },
];

function getPalette(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return PALETTES[Math.abs(h) % PALETTES.length];
}

/* ─── Subjects ──────────────────────────────────────────────────────────── */
function SubjectsGrid({ subjects, batchId }: { subjects: Subject[]; batchId: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up">
      {subjects.map((subject, i) => {
        const p = getPalette(subject.subject);
        return (
          <Link
            key={subject._id}
            href={`/batch/${batchId}/subject/${subject._id}`}
            className="group block animate-fade-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="card rounded-2xl p-5 flex items-center gap-4">
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300"
                style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
              >
                {subject.imageId ? (
                  <Image
                    src={`${subject.imageId.baseUrl}${subject.imageId.key}`}
                    alt={subject.subject}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover rounded-2xl"
                    unoptimized
                  />
                ) : (
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-slate-900 font-bold text-[15px] truncate group-hover:text-indigo-700 transition-colors">
                  {subject.subject}
                </h3>
                <span
                  className="cat-pill mt-1.5 inline-block"
                  style={{ background: p.badge, color: p.badgeText }}
                >
                  Subject
                </span>
              </div>

              {/* Arrow */}
              <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center transition-all flex-shrink-0">
                <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ─── Faculty ───────────────────────────────────────────────────────────── */
function FacultyGrid({ teachers }: { teachers: Teacher[] }) {
  if (teachers.length === 0) {
    return (
      <div className="text-center py-24 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-slate-700 font-bold text-lg mb-1">No faculty listed</h3>
        <p className="text-slate-400 text-sm">Faculty data isn&apos;t available for this batch</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-up">
      {teachers.map((teacher, i) => {
        const p = getPalette(`${teacher.firstName}${teacher.lastName}`);
        return (
          <div
            key={teacher._id}
            className="card rounded-2xl overflow-hidden animate-fade-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            {/* Top color band */}
            <div
              className="h-20 relative"
              style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
            >
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `radial-gradient(circle at 30% 30%, white 1px, transparent 1px)`,
                  backgroundSize: "16px 16px"
                }}
              />
            </div>

            {/* Avatar */}
            <div className="flex justify-center -mt-10 mb-3">
              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white shadow-lg">
                {teacher.imageId ? (
                  <Image
                    src={`${teacher.imageId.baseUrl}${teacher.imageId.key}`}
                    alt={`${teacher.firstName} ${teacher.lastName}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                  >
                    <span className="text-2xl font-black text-white">{teacher.firstName.charAt(0)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="px-5 pb-5 text-center">
              <h3 className="text-slate-900 font-extrabold text-base mb-1">
                {teacher.firstName} {teacher.lastName}
              </h3>
              {teacher.qualification && (
                <p className="text-slate-400 text-xs mb-1.5">{teacher.qualification}</p>
              )}
              {teacher.email && (
                <p className="text-slate-400 text-xs mb-3 truncate">{teacher.email}</p>
              )}
              {teacher.subject && (
                <span
                  className="cat-pill inline-block mt-1"
                  style={{ background: p.badge, color: p.badgeText }}
                >
                  {teacher.subject}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Live Classes ──────────────────────────────────────────────────────── */
interface LiveClassItem {
  _id: string;
  topic?: string;
  name?: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  status?: string;
  tag?: string;
  urlType?: string;
  url?: string;
  ytStreamUrl?: string;
  isFree?: boolean;
  videoDetails?: { _id?: string; name?: string; image?: string; duration?: string; videoUrl?: string; findKey?: string } | null;
  subjectId?: { _id: string; name: string; slug: string };
  batchSubjectId?: string;
  tags?: { _id: string; name: string }[];
  slug?: string;
  lectureType?: string;
  hasAttachment?: boolean;
  homeworkIds?: { _id: string; topic: string; note: string; attachmentIds: { _id: string; baseUrl: string; key: string; name: string }[] }[];
}

function getClassStatus(cls: LiveClassItem): { label: string; color: string; bg: string; dot: string } {
  const now = new Date();
  const start = cls.startTime ? new Date(cls.startTime) : null;
  const end = cls.endTime ? new Date(cls.endTime) : null;
  if (start && end && now >= start && now <= end)
    return { label: "LIVE", color: "text-red-700", bg: "bg-red-50 border-red-200", dot: "bg-red-500" };
  if (end && now > end)
    return { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" };
  if (start && now < start)
    return { label: "Upcoming", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500" };
  const tag = cls.tag || cls.status;
  if (tag) return { label: tag, color: "text-blue-700", bg: "bg-blue-50 border-blue-200", dot: "bg-blue-500" };
  return { label: "", color: "", bg: "", dot: "" };
}

function LiveClasses({ batchId }: { batchId: string }) {
  const [classes, setClasses] = useState<LiveClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function openLiveClassInNewTab(cls: LiveClassItem) {
    const title = encodeURIComponent(cls.topic || cls.videoDetails?.name || cls.name || "Live Class");
    const isLive = getClassStatus(cls).label === "LIVE" ? "1" : "0";
    const directUrl = isLive === "1" ? (cls.url || cls.ytStreamUrl || "") : "";
    const params = new URLSearchParams({
      videoId: cls._id,
      batchId,
      subjectId: cls.subjectId?._id || "",
      subjectSlug: cls.subjectId?.slug || "",
      title,
      isLive,
      ...(directUrl ? { directUrl } : {}),
      ...(cls.urlType ? { urlType: cls.urlType } : {}),
    });
    window.open(`/live?${params.toString()}`, "_blank");
  }

  const fetchLiveClasses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to fetch live classes"); return; }
      let items: LiveClassItem[] = [];
      if (Array.isArray(data?.data)) items = data.data;
      else if (Array.isArray(data)) items = data;
      setClasses(items);
    } catch {
      setError("Failed to fetch live classes");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => { fetchLiveClasses(); }, [fetchLiveClasses]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card rounded-2xl overflow-hidden">
            <div className="aspect-video shimmer" />
            <div className="p-4 space-y-3">
              <div className="h-4 rounded-xl shimmer w-3/4" />
              <div className="h-3 rounded-xl shimmer w-1/2" />
              <div className="h-3 rounded-xl shimmer w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-24 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h3 className="text-slate-800 font-bold text-lg mb-1">Something went wrong</h3>
        <p className="text-red-400 text-sm mb-5">{error}</p>
        <button onClick={fetchLiveClasses} className="btn-primary px-6 py-2.5 rounded-xl font-bold text-sm">
          Try again
        </button>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-24 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-slate-800 font-bold text-lg mb-1">No Live Classes</h3>
        <p className="text-slate-400 text-sm">No scheduled sessions at the moment. Check back later!</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-up">
        {classes.map((cls, i) => {
          const title = cls.topic || cls.videoDetails?.name || "Live Class";
          const startTime = cls.startTime || cls.date;
          const { label: statusLabel, color: statusColor, bg: statusBg, dot: statusDot } = getClassStatus(cls);
          const tagNames = cls.tags?.map((t) => t.name).filter(Boolean) || [];
          const subjectName = cls.subjectId?.name || "";
          const p = getPalette(subjectName || title);
          const isPlayable =
            statusLabel === "Completed" || statusLabel === "LIVE" ||
            cls.tag === "Ended" || cls.tag === "ENDED" || cls.status === "ENDED" || cls.status === "Ended" ||
            cls.tag === "ended" || cls.status === "ended" || cls.status === "COMPLETED" || cls.status === "completed" ||
            !!cls.videoDetails || !!cls.url || !!cls.ytStreamUrl;
          const thumbnail = cls.videoDetails?.image || null;

          return (
            <div
              key={cls._id}
              className={`card rounded-2xl overflow-hidden flex flex-col animate-fade-up ${isPlayable ? "cursor-pointer" : ""}`}
              style={{ animationDelay: `${i * 30}ms` }}
              onClick={() => { if (isPlayable) openLiveClassInNewTab(cls); }}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden">
                {thumbnail ? (
                  <Image src={thumbnail} alt={title} fill className="object-cover" unoptimized sizes="33vw" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-white/15 ring-2 ring-white/30">
                        <Image src="/pw-logo.jpg" alt="PW" width={56} height={56} className="w-full h-full object-cover rounded-full" unoptimized />
                      </div>
                      {subjectName && <p className="text-white/90 text-xs font-semibold text-center px-4 line-clamp-1">{subjectName}</p>}
                    </div>
                  </div>
                )}

                {/* Play hover overlay */}
                {isPlayable && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 hover:opacity-100 transition-all duration-300 flex items-center justify-center group/play">
                    <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl opacity-0 group-hover/play:opacity-100 scale-75 group-hover/play:scale-100 transition-all duration-300">
                      <svg className="w-6 h-6 text-indigo-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Status */}
                {statusLabel && (
                  <div className="absolute top-2.5 right-2.5">
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusBg} ${statusColor}`}>
                      {statusLabel === "LIVE" && <span className={`w-1.5 h-1.5 rounded-full ${statusDot} animate-pulse`} />}
                      {statusLabel}
                    </span>
                  </div>
                )}
                {cls.isFree && (
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">FREE</span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-4 flex-1">
                <h3 className="text-slate-900 font-bold text-sm leading-snug line-clamp-2 mb-2">{title}</h3>
                {tagNames.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {tagNames.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold border border-indigo-100">{tag}</span>
                    ))}
                  </div>
                )}
                {startTime && (
                  <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-1">
                    <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(startTime).toLocaleString("en-US", {
                      weekday: "short", month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ─── BatchTabs ─────────────────────────────────────────────────────────── */
export default function BatchTabs({ batchDetail }: BatchTabsProps) {
  const [activeTab, setActiveTab] = useState<"live" | "subjects" | "faculty">("subjects");

  const allTeachers = useMemo(() => {
    const map = new Map<string, Teacher>();
    for (const s of batchDetail.subjects) for (const t of s.teacherIds) if (!map.has(t._id)) map.set(t._id, t);
    return Array.from(map.values());
  }, [batchDetail.subjects]);

  const tabs = [
    {
      key: "subjects" as const,
      label: "Subjects",
      count: batchDetail.subjects.length,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      key: "live" as const,
      label: "Live Classes",
      count: null,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.902L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: "faculty" as const,
      label: "Faculty",
      count: allTeachers.length,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex gap-1.5 mb-7 bg-slate-100/80 rounded-2xl p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === tab.key
                ? "tab-pill-active text-white"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/70"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== null && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                activeTab === tab.key
                  ? "bg-white/25 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "subjects" && <SubjectsGrid subjects={batchDetail.subjects} batchId={batchDetail._id} />}
      {activeTab === "live" && <LiveClasses batchId={batchDetail._id} />}
      {activeTab === "faculty" && <FacultyGrid teachers={allTeachers} />}
    </div>
  );
}
