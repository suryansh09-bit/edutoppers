"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import LiveVideoPlayer from "./LiveVideoPlayer";
import type { Subject, Teacher, BatchDetail } from "@/lib/types";

interface BatchTabsProps {
  batchDetail: BatchDetail;
}

/* ─── Subjects ─────────────────────────────────────────────────────────── */
const SUBJECT_COLORS = [
  { from: "#6366f1", to: "#8b5cf6", bg: "#eef2ff", text: "#4338ca" },
  { from: "#ec4899", to: "#f43f5e", bg: "#fdf2f8", text: "#9d174d" },
  { from: "#10b981", to: "#059669", bg: "#ecfdf5", text: "#065f46" },
  { from: "#f59e0b", to: "#ef4444", bg: "#fffbeb", text: "#92400e" },
  { from: "#3b82f6", to: "#6366f1", bg: "#eff6ff", text: "#1e40af" },
  { from: "#8b5cf6", to: "#ec4899", bg: "#f5f3ff", text: "#5b21b6" },
];
function subjectColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return SUBJECT_COLORS[Math.abs(h) % SUBJECT_COLORS.length];
}

function SubjectsGrid({ subjects, batchId }: { subjects: Subject[]; batchId: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up">
      {subjects.map((subject) => {
        const sc = subjectColor(subject.subject);
        return (
          <Link key={subject._id} href={`/batch/${batchId}/subject/${subject._id}`} className="group block">
            <div className="card-gradient rounded-2xl p-5 flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ background: `linear-gradient(135deg, ${sc.from}, ${sc.to})` }}
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
              <div className="flex-1 min-w-0">
                <h3 className="text-slate-900 font-bold text-base truncate group-hover:text-indigo-700 transition-colors">
                  {subject.subject}
                </h3>
                <span className="text-xs font-semibold mt-1 inline-block px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.text }}>
                  Subject
                </span>
              </div>
              <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
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
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <p className="text-slate-500 font-medium">No faculty data available</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up">
      {teachers.map((teacher) => (
        <div key={teacher._id} className="card-gradient rounded-2xl p-6 text-center">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-4 overflow-hidden bg-indigo-50 ring-2 ring-indigo-100">
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
              <div className="w-full h-full flex items-center justify-center text-3xl font-black text-indigo-400">
                {teacher.firstName.charAt(0)}
              </div>
            )}
          </div>
          <h3 className="text-slate-900 font-bold text-base mb-1">{teacher.firstName} {teacher.lastName}</h3>
          {teacher.qualification && (
            <p className="text-slate-500 text-sm mb-1"><span className="font-semibold text-indigo-600">Qualification:</span> {teacher.qualification}</p>
          )}
          {teacher.email && (
            <p className="text-slate-500 text-sm mb-1 truncate"><span className="font-semibold text-indigo-600">Email:</span> {teacher.email}</p>
          )}
          {teacher.subject && (
            <span className="inline-block px-4 py-1.5 btn-purple text-white text-xs rounded-full font-semibold mt-2">{teacher.subject}</span>
          )}
        </div>
      ))}
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

function getClassStatus(cls: LiveClassItem): { label: string; color: string; bg: string } {
  const now = new Date();
  const start = cls.startTime ? new Date(cls.startTime) : null;
  const end = cls.endTime ? new Date(cls.endTime) : null;
  if (start && end && now >= start && now <= end) return { label: "LIVE", color: "text-red-700", bg: "bg-red-50 border-red-200" };
  if (end && now > end) return { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
  if (start && now < start) return { label: "Upcoming", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
  const tag = cls.tag || cls.status;
  if (tag) return { label: tag, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" };
  return { label: "", color: "", bg: "" };
}

function LiveClasses({ batchId }: { batchId: string }) {
  const [classes, setClasses] = useState<LiveClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playingClass, setPlayingClass] = useState<LiveClassItem | null>(null);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-gradient rounded-2xl overflow-hidden">
            <div className="aspect-video shimmer" />
            <div className="p-4 space-y-2">
              <div className="h-4 rounded-lg shimmer w-3/4" />
              <div className="h-3 rounded-lg shimmer w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <p className="text-red-500 font-semibold mb-4">{error}</p>
        <button onClick={fetchLiveClasses} className="btn-purple text-white px-6 py-2.5 rounded-xl font-semibold text-sm">Retry</button>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-slate-700 font-semibold text-lg mb-1">No Live Classes</h3>
        <p className="text-slate-400 text-sm">No scheduled live classes at the moment.</p>
      </div>
    );
  }

  return (
    <>
      {playingClass && (
        <LiveVideoPlayer
          videoId={playingClass._id}
          batchId={batchId}
          subjectId={playingClass.subjectId?._id || ""}
          subjectSlug={playingClass.subjectId?.slug || ""}
          title={playingClass.topic || playingClass.name || playingClass.videoDetails?.name || "Live Class"}
          isLive={getClassStatus(playingClass).label === "LIVE"}
          directUrl={
            getClassStatus(playingClass).label === "LIVE"
              ? (playingClass.url || playingClass.ytStreamUrl || undefined)
              : undefined
          }
          urlType={playingClass.urlType || undefined}
          onClose={() => setPlayingClass(null)}
        />
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up">
        {classes.map((cls) => {
          const title = cls.topic || cls.videoDetails?.name || "Live Class";
          const startTime = cls.startTime || cls.date;
          const { label: statusLabel, color: statusColor, bg: statusBg } = getClassStatus(cls);
          const tagNames = cls.tags?.map((t) => t.name).filter(Boolean) || [];
          const subjectName = cls.subjectId?.name || "";
          const sc = subjectColor(subjectName || title);
          const isPlayable =
            statusLabel === "Completed" || statusLabel === "LIVE" ||
            cls.tag === "Ended" || cls.tag === "ENDED" || cls.status === "ENDED" || cls.status === "Ended" ||
            !!cls.videoDetails || !!cls.url || !!cls.ytStreamUrl;
          const thumbnail = cls.videoDetails?.image || null;

          return (
            <div
              key={cls._id}
              className={`card-gradient rounded-2xl overflow-hidden flex flex-col ${isPlayable ? "cursor-pointer" : ""}`}
              onClick={() => { if (isPlayable) setPlayingClass(cls); }}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden">
                {thumbnail ? (
                  <Image src={thumbnail} alt={title} fill className="object-cover" unoptimized sizes="33vw" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${sc.from}, ${sc.to})` }}>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-white/15 ring-2 ring-white/30">
                        <Image src="/pw-logo.jpg" alt="PW" width={56} height={56} className="w-full h-full object-cover rounded-full" unoptimized />
                      </div>
                      {subjectName && <p className="text-white/90 text-xs font-semibold text-center px-4 line-clamp-1">{subjectName}</p>}
                    </div>
                  </div>
                )}

                {/* Play hover */}
                {isPlayable && (
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/25 transition-all duration-300 flex items-center justify-center group/play">
                    <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg opacity-0 group-hover/play:opacity-100 scale-75 group-hover/play:scale-100 transition-all duration-300">
                      <svg className="w-5 h-5 text-indigo-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                )}

                {/* Status badge */}
                {statusLabel && (
                  <div className="absolute top-2.5 right-2.5">
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${statusBg} ${statusColor}`}>
                      {statusLabel === "LIVE" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                      {statusLabel}
                    </span>
                  </div>
                )}
                {cls.isFree && (
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">FREE</span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-4 flex-1">
                <h3 className="text-slate-900 font-semibold text-sm leading-snug line-clamp-2 mb-2">{title}</h3>
                {tagNames.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {tagNames.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-medium border border-indigo-100">{tag}</span>
                    ))}
                  </div>
                )}
                {startTime && (
                  <p className="text-slate-400 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    { key: "subjects" as const, label: "Subjects", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )},
    { key: "live" as const, label: "Live Classes", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.902L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    )},
    { key: "faculty" as const, label: "Faculty", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-100 rounded-2xl p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === tab.key
                ? "tab-active text-white shadow-md"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "subjects" && <SubjectsGrid subjects={batchDetail.subjects} batchId={batchDetail._id} />}
      {activeTab === "live" && <LiveClasses batchId={batchDetail._id} />}
      {activeTab === "faculty" && <FacultyGrid teachers={allTeachers} />}
    </div>
  );
}
