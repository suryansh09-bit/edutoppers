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

function formatDuration(dur: string): string {
  return dur;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
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

  const contentTypeMap: Record<TabKey, string> = {
    lectures: "videos",
    notes: "notes",
    dpp: "dpp",
  };

  const fetchContent = useCallback(
    async (tab: TabKey) => {
      setLoading(true);
      setError("");
      setContent([]);

      const ct = contentTypeMap[tab];
      const endpoint = `/api/pw/datacontent?batchId=${batchId}&subjectSlug=${encodeURIComponent(subjectSlug)}&topicSlug=${encodeURIComponent(topicSlug)}&contentType=${ct}`;

      try {
        const res = await fetch(
          `/api/decrypt?endpoint=${encodeURIComponent(endpoint)}`
        );
        const data = await res.json();

        if (data.success === false) {
          // Empty data is not an error — just means no content
          setContent([]);
          return;
        }

        let items: ContentItem[] = [];
        if (Array.isArray(data.data)) {
          items = data.data;
        } else if (Array.isArray(data)) {
          items = data;
        } else if (data.data && typeof data.data === "object") {
          items = [data.data];
        }

        setContent(items);
      } catch {
        setError("Failed to fetch content");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [batchId, subjectSlug, topicSlug]
  );

  useEffect(() => {
    fetchContent(activeTab);
  }, [fetchContent, activeTab]);

  const handleDownloadNote = async (item: ContentItem, hw?: HomeworkItem) => {
    const downloadId = hw ? hw._id : item._id;
    setDownloadingId(downloadId);
    try {
      const res = await fetch(
        `/api/attachment?batchId=${batchId}&subjectId=${subjectId}&contentId=${item._id}`
      );
      const data = await res.json();

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const att = data.data.find(
          (a: { topic?: string; url?: string }) =>
            hw ? a.topic === hw.topic : true
        );
        if (att?.url) {
          window.open(att.url, "_blank");
          return;
        }
        if (data.data[0]?.url) {
          window.open(data.data[0].url, "_blank");
          return;
        }
      }

      // Fallback: use attachmentIds from homework item
      if (hw?.attachmentIds && hw.attachmentIds.length > 0) {
        const att = hw.attachmentIds[0];
        const url = att.key
          ? `${att.baseUrl}${att.key}`
          : `${att.baseUrl}`;
        if (att.key) {
          window.open(url, "_blank");
          return;
        }
      }

      alert("No download URL available");
    } catch {
      alert("Failed to get download URL");
    } finally {
      setDownloadingId(null);
    }
  };

  const tabs = [
    { key: "lectures" as const, label: "Lectures", icon: "\u25B6" },
    { key: "notes" as const, label: "Notes", icon: "\u{1F4C4}" },
    { key: "dpp" as const, label: "DPP", icon: "\u{1F4D3}" },
  ];

  return (
    <div>
      {playingItem && (
        <VideoPlayer
          batchId={batchId}
          subjectId={subjectId}
          childId={playingItem.videoDetails?.findKey || playingItem._id}
          subjectSlug={subjectSlug}
          title={
            playingItem.videoDetails?.name ||
            playingItem.topic ||
            topicName
          }
          onClose={() => setPlayingItem(null)}
        />
      )}

      <div className="flex gap-1 mb-6 bg-bg-card rounded-xl p-1.5 border border-border-color overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 px-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
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

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-10 h-10 border-4 border-accent-purple border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-text-secondary">Loading content...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4 opacity-50">&#9888;</div>
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={() => fetchContent(activeTab)}
            className="btn-purple text-white px-6 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      ) : content.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4 opacity-50">
            {activeTab === "lectures"
              ? "\u{1F3AC}"
              : activeTab === "notes"
                ? "\u{1F4C4}"
                : "\u{1F4DD}"}
          </div>
          <p className="text-text-secondary text-lg">
            No{" "}
            {activeTab === "lectures"
              ? "lectures"
              : activeTab === "notes"
                ? "notes"
                : "DPP"}
            {" "}available for this topic
          </p>
        </div>
      ) : activeTab === "lectures" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.map((item) => {
            const vd = item.videoDetails;
            const imageUrl = vd?.image || null;
            const title = vd?.name || item.topic;
            const duration = vd?.duration;
            const date = item.date || item.startTime;

            return (
              <div
                key={item._id}
                className="card-gradient rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                onClick={() => setPlayingItem(item)}
              >
                {imageUrl && (
                  <div className="relative aspect-video bg-bg-secondary">
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                      unoptimized
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-accent-purple/90 flex items-center justify-center">
                        <span className="text-white text-2xl ml-1">
                          &#9654;
                        </span>
                      </div>
                    </div>
                    {item.status && (
                      <div className="absolute top-2 right-2">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-bold ${
                            item.status === "COMPLETED"
                              ? "bg-green-500/80 text-white"
                              : "bg-yellow-500/80 text-black"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                    {title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    {date && <span>{formatDate(date)}</span>}
                    {duration && <span>{formatDuration(duration)}</span>}
                    {!duration && (
                      <span className="text-accent-purple font-medium">
                        Play
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Notes and DPP tabs */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.map((item) => {
            const homeworks = item.homeworkIds || [];
            if (homeworks.length === 0) {
              return (
                <div
                  key={item._id}
                  className="card-gradient rounded-xl p-5 transition-all duration-300"
                >
                  <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                    {item.topic}
                  </h3>
                  <p className="text-text-secondary text-xs">
                    No attachments available
                  </p>
                </div>
              );
            }

            return homeworks.map((hw) => (
              <div
                key={hw._id}
                className="card-gradient rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                onClick={() => handleDownloadNote(item, hw)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-accent-purple/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-2xl">
                      {activeTab === "dpp" ? "\u{1F4DD}" : "\u{1F4C4}"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                      {hw.topic}
                    </h3>
                    <p className="text-text-secondary text-xs mb-2">
                      {hw.note}
                    </p>
                    {hw.attachmentIds?.length > 0 && (
                      <p className="text-text-secondary text-xs mb-2">
                        {hw.attachmentIds[0].name}
                      </p>
                    )}
                    <span
                      className={`inline-block btn-purple text-white px-3 py-1 rounded-md text-xs font-medium ${
                        downloadingId === hw._id ? "opacity-50" : ""
                      }`}
                    >
                      {downloadingId === hw._id ? "Loading..." : "Download PDF"}
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
