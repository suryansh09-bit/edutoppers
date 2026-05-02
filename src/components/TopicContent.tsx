"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface AttachmentItem {
  _id: string;
  baseUrl: string;
  key: string;
  name: string;
  createdAt?: string;
}

interface HomeworkItem {
  _id: string;
  topic: string;
  note: string;
  attachmentIds: AttachmentItem[];
  actions?: string[];
  slug?: string;
  status?: string;
  solutionVideoType?: string;
  solutionVideoUrl?: string | null;
}

interface ContentItem {
  _id: string;
  topic: string;
  status?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  videoDetails?: {
    _id: string;
    id?: string;
    name: string;
    image?: string;
    videoUrl?: string;
    duration?: string;
    status?: string;
    types?: string[];
    drmProtected?: boolean;
    findKey?: string;
  } | null;
  homeworkIds?: HomeworkItem[];
  hasAttachment?: boolean;
  isDPPNotes?: boolean;
  isDPPVideos?: boolean;
  isVideoLecture?: boolean;
  lectureType?: string;
  tags?: { _id: string; name: string }[];
}

interface TopicContentProps {
  batchId: string;
  subjectId: string;
  topicId: string;
  topicName: string;
  subjectSlug: string;
  topicSlug: string;
}

type TabKey = "lectures" | "notes" | "dpp";

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return dateStr; }
}

export default function TopicContent({
  batchId,
  subjectId,
  topicName,
  subjectSlug,
  topicSlug,
}: TopicContentProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("lectures");
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  function openVideoInNewTab(item: ContentItem) {
    const childId = item.videoDetails?.findKey || item._id;
    const title = encodeURIComponent(item.videoDetails?.name || item.topic || "");
    const url = `/watch?batchId=${batchId}&subjectId=${subjectId}&childId=${childId}&subjectSlug=${encodeURIComponent(subjectSlug)}&title=${title}`;
    window.open(url, "_blank");
  }

  const contentTypeMap: Record<TabKey, string> = { lectures: "videos", notes: "notes", dpp: "dpp" };

  const fetchContent = useCallback(async (tab: TabKey) => {
    setLoading(true);
    setError("");
    setContent([]);
    const ct = contentTypeMap[tab];
    const endpoint = `/api/pw/datacontent?batchId=${batchId}&subjectSlug=${encodeURIComponent(subjectSlug)}&topicSlug=${encodeURIComponent(topicSlug)}&contentType=${ct}`;
    try {
      const res = await fetch(`/api/decrypt?endpoint=${encodeURIComponent(endpoint)}`);
      const data = await res.json();
      if (data.success === false) { setContent([]); return; }
      let items: ContentItem[] = [];
      if (Array.isArray(data.data)) items = data.data;
      else if (Array.isArray(data)) items = data;
      else if (data.data && typeof data.data === "object") items = [data.data];
      setContent(items);
    } catch {
      setError("Failed to fetch content");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId, subjectSlug, topicSlug]);

  useEffect(() => { fetchContent(activeTab); }, [fetchContent, activeTab]);

  const handleDownloadNote = async (item: ContentItem, hw?: HomeworkItem) => {
    const downloadId = hw ? hw._id : item._id;
    setDownloadingId(downloadId);
    try {
      const res = await fetch(`/api/attachment?batchId=${batchId}&subjectId=${subjectId}&contentId=${item._id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const att = data.data.find((a: { topic?: string; url?: string }) => hw ? a.topic === hw.topic : true);
        if (att?.url) { window.open(att.url, "_blank"); return; }
        if (data.data[0]?.url) { window.open(data.data[0].url, "_blank"); return; }
      }
      if (hw?.attachmentIds && hw.attachmentIds.length > 0) {
        const att = hw.attachmentIds[0];
        if (att.key) { window.open(`${att.baseUrl}${att.key}`, "_blank"); return; }
      }
      alert("No download URL available");
    } catch {
      alert("Failed to get download URL");
    } finally {
      setDownloadingId(null);
    }
  };

  const tabs = [
    {
      key: "lectures" as const,
      label: "Lectures",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      ),
    },
    {
      key: "notes" as const,
      label: "Notes",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      key: "dpp" as const,
      label: "DPP",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
  ];

  const emptyConfig = {
    lectures: { emoji: "🎬", label: "lectures", desc: "No video lectures uploaded yet" },
    notes: { emoji: "📄", label: "notes", desc: "No notes available for this topic" },
    dpp: { emoji: "📝", label: "DPP", desc: "No practice problems available" },
  };

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1.5 mb-7 bg-slate-100/80 rounded-2xl p-1.5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === tab.key
                ? "tab-pill-active text-white"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/70"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card rounded-2xl overflow-hidden">
              <div className={activeTab === "lectures" ? "aspect-video shimmer" : "h-28 shimmer"} />
              <div className="p-4 space-y-2.5">
                <div className="h-4 rounded-xl shimmer w-3/4" />
                <div className="h-3 rounded-xl shimmer w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-24 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h3 className="text-slate-800 font-bold text-lg mb-1">Something went wrong</h3>
          <p className="text-red-400 text-sm mb-5">{error}</p>
          <button onClick={() => fetchContent(activeTab)} className="btn-primary px-6 py-2.5 rounded-xl font-bold text-sm">
            Try again
          </button>
        </div>
      ) : content.length === 0 ? (
        <div className="text-center py-24 animate-fade-in">
          <div className="text-5xl mb-4">{emptyConfig[activeTab].emoji}</div>
          <h3 className="text-slate-800 font-bold text-lg mb-1">No {emptyConfig[activeTab].label} available</h3>
          <p className="text-slate-400 text-sm">{emptyConfig[activeTab].desc}</p>
        </div>
      ) : activeTab === "lectures" ? (
        /* Lectures grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-up">
          {content.map((item, i) => {
            const vd = item.videoDetails;
            const imageUrl = vd?.image || null;
            const title = vd?.name || item.topic;
            const duration = vd?.duration;
            const date = item.date || item.startTime;

            return (
              <div
                key={item._id}
                className="card rounded-2xl overflow-hidden cursor-pointer group animate-fade-up"
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => openVideoInNewTab(item)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-indigo-50 overflow-hidden">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="33vw"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 via-indigo-50 to-violet-100">
                      <div className="w-16 h-16 rounded-2xl bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-sm">
                        <svg className="w-8 h-8 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                      <svg className="w-6 h-6 text-indigo-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Status */}
                  {item.status && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${item.status === "COMPLETED" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
                        {item.status}
                      </span>
                    </div>
                  )}

                  {/* Duration chip */}
                  {duration && (
                    <div className="absolute bottom-2.5 right-2.5">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {duration}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-slate-900 font-bold text-sm mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors">{title}</h3>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    {date && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(date)}
                      </span>
                    )}
                    <span className="text-indigo-500 font-bold flex items-center gap-0.5 group-hover:text-indigo-700 transition-colors">
                      Watch
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Notes / DPP grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-up">
          {content.map((item) => {
            const homeworks = item.homeworkIds || [];
            if (homeworks.length === 0) {
              return (
                <div key={item._id} className="card-flat rounded-2xl p-5">
                  <h3 className="text-slate-600 font-semibold text-sm mb-1 line-clamp-2">{item.topic}</h3>
                  <p className="text-slate-400 text-xs">No attachments available</p>
                </div>
              );
            }
            return homeworks.map((hw, i) => (
              <div
                key={hw._id}
                className="card rounded-2xl p-5 cursor-pointer group animate-fade-up"
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => handleDownloadNote(item, hw)}
              >
                <div className="flex items-start gap-3.5">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    activeTab === "dpp"
                      ? "bg-amber-50 group-hover:bg-amber-100"
                      : "bg-indigo-50 group-hover:bg-indigo-100"
                  }`}>
                    {activeTab === "dpp" ? (
                      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-slate-900 font-bold text-sm mb-1 line-clamp-2 group-hover:text-indigo-700 transition-colors">{hw.topic}</h3>
                    {hw.note && <p className="text-slate-400 text-xs mb-2 line-clamp-1">{hw.note}</p>}
                    {hw.attachmentIds?.length > 0 && (
                      <p className="text-slate-400 text-xs mb-3 truncate font-medium">{hw.attachmentIds[0].name}</p>
                    )}
                    <button
                      className={`inline-flex items-center gap-1.5 btn-primary px-3.5 py-2 rounded-xl text-xs font-bold ${downloadingId === hw._id ? "opacity-60 pointer-events-none" : ""}`}
                    >
                      {downloadingId === hw._id ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Loading...
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download PDF
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ));
          })}
        </div>
      )}
    </div>
  );
}
