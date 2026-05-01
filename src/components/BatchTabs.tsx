"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import LiveVideoPlayer from "./LiveVideoPlayer";
import type { Subject, Teacher, BatchDetail } from "@/lib/types";

interface BatchTabsProps {
  batchDetail: BatchDetail;
}

function SubjectsGrid({
  subjects,
  batchId,
}: {
  subjects: Subject[];
  batchId: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {subjects.map((subject) => (
        <Link
          key={subject._id}
          href={`/batch/${batchId}/subject/${subject._id}`}
        >
          <div className="card-gradient rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] cursor-pointer flex items-center gap-4">
            {subject.imageId ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-bg-secondary">
                <Image
                  src={`${subject.imageId.baseUrl}${subject.imageId.key}`}
                  alt={subject.subject}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-8 h-8 text-accent-purple"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-lg truncate">
                {subject.subject}
              </h3>
              <p className="text-text-secondary text-sm">Subject</p>
              <p className="text-accent-green text-xs mt-1">Available</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-accent-green flex-shrink-0" />
          </div>
        </Link>
      ))}
    </div>
  );
}

function FacultyGrid({ teachers }: { teachers: Teacher[] }) {
  if (teachers.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4 opacity-50">&#128100;</div>
        <p className="text-text-secondary text-lg">
          No faculty data available
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {teachers.map((teacher) => (
        <div
          key={teacher._id}
          className="card-gradient rounded-xl p-6 text-center relative"
        >
          <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-accent-blue" />
          <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-bg-secondary border-2 border-border-color">
            {teacher.imageId ? (
              <Image
                src={`${teacher.imageId.baseUrl}${teacher.imageId.key}`}
                alt={`${teacher.firstName} ${teacher.lastName}`}
                width={96}
                height={96}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-accent-purple">
                {teacher.firstName.charAt(0)}
              </div>
            )}
          </div>
          <h3 className="text-white font-bold text-lg mb-2">
            {teacher.firstName} {teacher.lastName}
          </h3>
          {teacher.qualification && (
            <p className="text-text-secondary text-sm mb-1">
              <span className="text-accent-purple font-medium">
                Qualification:
              </span>{" "}
              {teacher.qualification}
            </p>
          )}
          {teacher.email && (
            <p className="text-text-secondary text-sm mb-1">
              <span className="text-accent-purple font-medium">Email:</span>{" "}
              {teacher.email}
            </p>
          )}
          {teacher.experience && (
            <p className="text-text-secondary text-sm mb-2">
              <span className="text-accent-purple font-medium">
                Experience:
              </span>{" "}
              {teacher.experience}
            </p>
          )}
          {teacher.subject && (
            <span className="inline-block px-4 py-1.5 btn-purple text-white text-sm rounded-full font-medium mt-2">
              {teacher.subject}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

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
  isFree?: boolean;
  videoDetails?: {
    _id?: string;
    name?: string;
    image?: string;
    duration?: string;
    videoUrl?: string;
    findKey?: string;
  } | null;
  subjectId?: {
    _id: string;
    name: string;
    slug: string;
  };
  batchSubjectId?: string;
  tags?: { _id: string; name: string }[];
  slug?: string;
  lectureType?: string;
  hasAttachment?: boolean;
  homeworkIds?: {
    _id: string;
    topic: string;
    note: string;
    attachmentIds: { _id: string; baseUrl: string; key: string; name: string }[];
  }[];
}

function getClassStatus(cls: LiveClassItem): { label: string; color: string } {
  const now = new Date();
  const start = cls.startTime ? new Date(cls.startTime) : null;
  const end = cls.endTime ? new Date(cls.endTime) : null;

  if (start && end && now >= start && now <= end) {
    return { label: "LIVE", color: "bg-red-500 text-white animate-pulse" };
  }
  if (end && now > end) {
    return { label: "Completed", color: "bg-green-500/80 text-white" };
  }
  if (start && now < start) {
    return { label: "Upcoming", color: "bg-yellow-500/80 text-black" };
  }
  const tag = cls.tag || cls.status;
  if (tag) {
    return { label: tag, color: "bg-blue-500/80 text-white" };
  }
  return { label: "", color: "" };
}

const GRADIENT_COLORS = [
  "from-purple-600/40 to-blue-600/40",
  "from-pink-600/40 to-rose-600/40",
  "from-emerald-600/40 to-teal-600/40",
  "from-orange-600/40 to-amber-600/40",
  "from-cyan-600/40 to-sky-600/40",
  "from-indigo-600/40 to-violet-600/40",
  "from-red-600/40 to-pink-600/40",
  "from-lime-600/40 to-green-600/40",
];

function getSubjectGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_COLORS[Math.abs(hash) % GRADIENT_COLORS.length];
}

function getSubjectInitials(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter((w) => w.length > 0 && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || name.substring(0, 2).toUpperCase();
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

      if (!res.ok) {
        setError(data.error || "Failed to fetch live classes");
        return;
      }

      let items: LiveClassItem[] = [];
      if (Array.isArray(data?.data)) {
        items = data.data;
      } else if (Array.isArray(data)) {
        items = data;
      }

      setClasses(items);
    } catch {
      setError("Failed to fetch live classes");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchLiveClasses();
  }, [fetchLiveClasses]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin w-10 h-10 border-4 border-accent-purple border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-text-secondary">Loading live classes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4 opacity-50">&#9888;</div>
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <button
          onClick={fetchLiveClasses}
          className="btn-purple text-white px-6 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4 opacity-50">&#128197;</div>
        <h3 className="text-text-secondary text-xl font-semibold mb-2">
          No Live Classes Available
        </h3>
        <p className="text-text-secondary/70 text-sm">
          There are no scheduled live classes at the moment.
        </p>
      </div>
    );
  }

  return (
    <>
      {playingClass && (
        <LiveVideoPlayer
          videoId={playingClass.videoDetails?.findKey || playingClass._id}
          batchId={batchId}
          subjectId={playingClass.subjectId?._id || ""}
          subjectSlug={playingClass.subjectId?.slug || ""}
          title={playingClass.topic || playingClass.videoDetails?.name || "Live Class"}
          isLive={getClassStatus(playingClass).label === "LIVE"}
          onClose={() => setPlayingClass(null)}
        />
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => {
          const title = cls.topic || cls.videoDetails?.name || "Live Class";
          const startTime = cls.startTime || cls.date;
          const endTime = cls.endTime;
          const { label: statusLabel, color: statusColor } = getClassStatus(cls);
          const tagNames = cls.tags?.map((t) => t.name).filter(Boolean) || [];
          const subjectName = cls.subjectId?.name || "";
          const gradient = getSubjectGradient(subjectName);
          const initials = getSubjectInitials(subjectName);
          const isPlayable = statusLabel === "Completed" || statusLabel === "LIVE" || cls.tag === "Ended" || !!cls.videoDetails;
          const thumbnailImage = cls.videoDetails?.image || null;

          return (
            <div
              key={cls._id}
              className={`card-gradient rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] ${isPlayable ? "cursor-pointer" : ""}`}
              onClick={() => { if (isPlayable) setPlayingClass(cls); }}
            >
              <div className={`relative aspect-video ${thumbnailImage ? "bg-black" : `bg-gradient-to-br ${gradient}`} flex items-center justify-center overflow-hidden`}>
                {thumbnailImage ? (
                  <Image
                    src={thumbnailImage}
                    alt={title}
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                ) : (
                  /* PW logo fallback for classes without images */
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <Image
                        src="/pw-logo.jpg"
                        alt="PW"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover rounded-full"
                        unoptimized
                      />
                    </div>
                    {subjectName && (
                      <p className="text-white/80 text-xs font-medium text-center px-4 line-clamp-1">
                        {subjectName}
                      </p>
                    )}
                    {!subjectName && (
                      <p className="text-white/60 text-xs font-medium text-center px-4 line-clamp-1">
                        {initials}
                      </p>
                    )}
                  </div>
                )}
                {isPlayable && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg">
                      <span className="text-white text-2xl ml-1">&#9654;</span>
                    </div>
                  </div>
                )}
                {statusLabel && (
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                )}
                {cls.isFree && (
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 rounded-md text-xs font-bold bg-green-500 text-white">
                      FREE
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">{title}</h3>
                {tagNames.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {tagNames.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-xs text-text-secondary space-y-1">
                  {startTime && (
                    <p>
                      {new Date(startTime).toLocaleString("en-US", {
                        weekday: "short", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                      {endTime && (
                        <span>{" - "}{new Date(endTime).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function BatchTabs({ batchDetail }: BatchTabsProps) {
  const [activeTab, setActiveTab] = useState<"live" | "subjects" | "faculty">(
    "subjects"
  );

  const allTeachers = useMemo(() => {
    const teacherMap = new Map<string, Teacher>();
    for (const subject of batchDetail.subjects) {
      for (const teacher of subject.teacherIds) {
        if (!teacherMap.has(teacher._id)) {
          teacherMap.set(teacher._id, teacher);
        }
      }
    }
    return Array.from(teacherMap.values());
  }, [batchDetail.subjects]);

  const tabs = [
    { key: "live" as const, label: "Live Classes", icon: "\u{1F4F9}" },
    { key: "subjects" as const, label: "Subjects", icon: "\u{1F4DA}" },
    {
      key: "faculty" as const,
      label: "Faculty",
      icon: "\u{1F468}\u200D\u{1F3EB}",
    },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-6 bg-bg-card rounded-xl p-1.5 border border-border-color">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === tab.key
                ? "tab-active text-white shadow-lg"
                : "text-text-secondary hover:text-white"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "live" && <LiveClasses batchId={batchDetail._id} />}
      {activeTab === "subjects" && (
        <SubjectsGrid
          subjects={batchDetail.subjects}
          batchId={batchDetail._id}
        />
      )}
      {activeTab === "faculty" && <FacultyGrid teachers={allTeachers} />}
    </div>
  );
}
