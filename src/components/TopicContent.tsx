"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import VideoPlayer from "./VideoPlayer";

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
  const [playingItem, setPlayingItem] = useState<ContentItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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
      key: "lectures" as const, label: "Lectures",
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>,
    },
    {
      key: "notes" as const, label: "Notes",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    },
    {
      key: "dpp" as const, label: "DPP",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    },
  ];

  const emptyIcons = { lectures: "🎬", notes: "📄", dpp: "📝" };
  const emptyLabels = { lectures: "lectures", notes: "notes", dpp: "DPP" };

  return (
    <div>
      {playingItem && (
        <VideoPlayer
          batchId={batchId}
          subjectId={subjectId}
          childId={playingItem.videoDetails?.findKey || playingItem._id}
          subjectSlug={subjectSlug}
          title={playingItem.videoDetails?.name || playingItem.topic || topicName}
          onClose={() => setPlayingItem(null)}
        />
      )}

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6 bg-slate-100 rounded-2xl p-1.5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === tab.key
                ? "tab-active text-white shadow-md"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-gradient rounded-2xl overflow-hidden">
              <div className={activeTab === "lectures" ? "aspect-video shimmer" : "h-28 shimmer"} />
              <div className="p-4 space-y-2">
                <div className="h-4 rounded-lg shimmer w-3/4" />
                <div className="h-3 rounded-lg shimmer w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <p className="text-red-500 font-semibold mb-4">{error}</p>
          <button onClick={() => fetchContent(activeTab)} className="btn-purple text-white px-6 py-2.5 rounded-xl font-semibold text-sm">Retry</button>
        </div>
      ) : content.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">{emptyIcons[activeTab]}</div>
          <h3 className="text-slate-700 font-semibold text-lg mb-1">No {emptyLabels[activeTab]} available</h3>
          <p className="text-slate-400 text-sm">Check back later for updates</p>
        </div>
      ) : activeTab === "lectures" ? (
        /* ── Lectures grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up">
          {content.map((item) => {
            const vd = item.videoDetails;
            const imageUrl = vd?.image || null;
            const title = vd?.name || item.topic;
            const duration = vd?.duration;
            const date = item.date || item.startTime;

            return (
              <div
                key={item._id}
                className="card-gradient rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => setPlayingItem(item)}
              >
                <div className="relative aspect-video bg-indigo-50 overflow-hidden">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="33vw" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                      <svg className="w-12 h-12 text-indigo-300" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                      <svg className="w-5 h-5 text-indigo-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                  {item.status && (
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${item.status === "COMPLETED" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
                        {item.status}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-slate-900 font-semibold text-sm mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors">{title}</h3>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    {date && <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>{formatDate(date)}</span>}
                    {duration ? (
                      <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{duration}</span>
                    ) : (
                      <span className="text-indigo-500 font-semibold">Watch →</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Notes / DPP grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up">
          {content.map((item) => {
            const homeworks = item.homeworkIds || [];
            if (homeworks.length === 0) {
              return (
                <div key={item._id} className="card-gradient rounded-2xl p-5">
                  <h3 className="text-slate-700 font-semibold text-sm mb-1 line-clamp-2">{item.topic}</h3>
                  <p className="text-slate-400 text-xs">No attachments available</p>
                </div>
              );
            }
            return homeworks.map((hw) => (
              <div
                key={hw._id}
                className="card-gradient rounded-2xl p-5 cursor-pointer group"
                onClick={() => handleDownloadNote(item, hw)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                    {activeTab === "dpp" ? (
                      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    ) : (
                      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-slate-900 font-semibold text-sm mb-1 line-clamp-2 group-hover:text-indigo-700 transition-colors">{hw.topic}</h3>
                    {hw.note && <p className="text-slate-400 text-xs mb-2 line-clamp-1">{hw.note}</p>}
                    {hw.attachmentIds?.length > 0 && (
                      <p className="text-slate-400 text-xs mb-3 truncate">{hw.attachmentIds[0].name}</p>
                    )}
                    <span className={`inline-flex items-center gap-1.5 btn-purple text-white px-3 py-1.5 rounded-lg text-xs font-semibold ${downloadingId === hw._id ? "opacity-60" : ""}`}>
                      {downloadingId === hw._id ? (
                        <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Loading...</>
                      ) : (
                        <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Download PDF</>
                      )}
                    </span>
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
