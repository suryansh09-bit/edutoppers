export interface Batch {
  batchId: string;
  batchName: string;
  batchImage: string;
}

export interface BatchDetail {
  _id: string;
  name: string;
  status: string;
  language: string;
  class: string;
  board: string;
  exam: string[];
  startDate: string;
  endDate: string;
  byName: string;
  description: string;
  shortDescription: string;
  subjects: Subject[];
  previewImage?: {
    baseUrl: string;
    key: string;
  };
  fee?: {
    amount: number;
    currency: string;
  };
  meta?: { key: string; value?: string }[];
}

export interface Subject {
  _id: string;
  subject: string;
  subjectId: string;
  slug: string;
  teacherIds: Teacher[];
  imageId?: {
    _id: string;
    name: string;
    baseUrl: string;
    key: string;
  };
  tagCount: number;
  lectureCount: number;
  batchId: string;
  isResources?: boolean;
}

export interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  imageId?: {
    baseUrl: string;
    key: string;
  };
  experience: string;
  qualification: string;
  email: string;
  subject: string;
  featuredLine?: string;
}

export interface Topic {
  _id: string;
  name: string;
  type: string;
  typeId: string;
  displayOrder: number;
  notes: number;
  exercises: number;
  videos: number;
  lectureVideos: number;
  slug: string;
}

export interface VideoContent {
  _id: string;
  topic: string;
  name: string;
  url?: string;
  videoUrl?: string;
  image?: {
    baseUrl: string;
    key: string;
  };
  videoDetails?: {
    name: string;
    image?: string;
    duration: number;
    videoUrl?: string;
    videoId?: string;
  };
  date?: string;
  createdAt?: string;
  duration?: number;
  type?: string;
  contentType?: string;
  description?: string;
  homeworkIds?: string[];
  attachmentIds?: { _id: string; name: string; baseUrl: string; key: string }[];
}

export interface LiveClass {
  _id: string;
  topic: string;
  name?: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  status?: string;
  teacherName?: string;
  subjectName?: string;
  videoDetails?: {
    name: string;
    image?: string;
    duration?: number;
    videoUrl?: string;
    videoId?: string;
  };
  image?: {
    baseUrl: string;
    key: string;
  };
  url?: string;
  type?: string;
  slug?: string;
  batchSubjectId?: string;
}

export interface DataContentItem {
  _id: string;
  topic: string;
  name: string;
  url?: string;
  videoUrl?: string;
  image?: {
    baseUrl: string;
    key: string;
  };
  videoDetails?: {
    name: string;
    image?: string;
    duration: number;
    videoUrl?: string;
    videoId?: string;
  };
  date?: string;
  createdAt?: string;
  duration?: number;
  type?: string;
  contentType?: string;
  description?: string;
  homeworkIds?: string[];
  attachmentIds?: { _id: string; name: string; baseUrl: string; key: string }[];
  childId?: string;
}

export interface TopicContents {
  success: boolean;
  data: VideoContent[];
}

export interface BatchesResponse {
  success: boolean;
  data: Batch[];
}

export interface TopicsResponse {
  success: boolean;
  data: Topic[];
}

export interface VideoPlayResponse {
  success: boolean;
  data?: {
    url?: string;
    videoUrl?: string;
    mpdUrl?: string;
    hlsUrl?: string;
    videoId?: string;
    name?: string;
    [key: string]: unknown;
  };
  error?: string;
}

export interface GetUrlResponse {
  success?: boolean;
  url?: string;
  data?: {
    url?: string;
    hlsUrl?: string;
    mpdUrl?: string;
    [key: string]: unknown;
  };
  error?: string;
}

export interface KidResponse {
  success?: boolean;
  kid?: string;
  data?: string;
  error?: string;
}

export interface OtpResponse {
  success?: boolean;
  otp?: string;
  playbackInfo?: string;
  data?: {
    otp?: string;
    playbackInfo?: string;
  };
  error?: string;
}

export interface AttachmentUrlResponse {
  success?: boolean;
  url?: string;
  data?: {
    url?: string;
    urls?: string[];
    [key: string]: unknown;
  };
  error?: string;
}
