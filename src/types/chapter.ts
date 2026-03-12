export interface Range {
  rangeId: string;
  name: string;
  description?: string;
  subChapterId: string;
  sapItemIds: string[]; // References to SAP items
  yellowChapterId?: string; // Link to yellow chapter for publishing
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  lastModified: string;
  createdBy?: {
    userId: string;
    username: string;
    color: string;
    timestamp: number;
  };
}

export interface SubBlueChapter {
  subChapterId: string;
  name: string;
  description?: string;
  parentChapterId: string;
  ranges: Range[];
  order: number; // For sorting
  createdAt: string;
}

export interface BlueChapter {
  chapterId: string;
  name: string;
  description?: string;
  color: '#0066B3'; // Blue theme
  subChapters: SubBlueChapter[];
  order: number; // For sorting
  createdAt: string;
}

export interface YellowChapter {
  yellowChapterId: string;
  name: string; // Typically matches blue chapter name
  description?: string;
  color: '#FFD700'; // Yellow/Gold theme
  linkedBlueChapterId: string;
  linkedRangeIds: string[]; // Ranges to publish
  publishedAt?: string;
  isLive: boolean;
  createdAt: string;
  navigationSlug?: string; // URL-friendly slug for navigation
}

export const generateChapterId = (prefix: 'blue' | 'yellow'): string => {
  return `${prefix}_chapter_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
};

export const generateSubChapterId = (): string => {
  return `sub_chapter_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
};

export const generateRangeId = (): string => {
  return `range_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
};

export const createDefaultBlueChapter = (): BlueChapter => ({
  chapterId: generateChapterId('blue'),
  name: '',
  color: '#0066B3',
  subChapters: [],
  order: 0,
  createdAt: new Date().toISOString(),
});

export const createDefaultSubChapter = (parentId: string): SubBlueChapter => ({
  subChapterId: generateSubChapterId(),
  name: '',
  parentChapterId: parentId,
  ranges: [],
  order: 0,
  createdAt: new Date().toISOString(),
});

export const createDefaultRange = (subChapterId: string): Range => ({
  rangeId: generateRangeId(),
  name: '',
  subChapterId,
  sapItemIds: [],
  isPublished: false,
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString(),
});

export const createDefaultYellowChapter = (blueChapterId: string): YellowChapter => ({
  yellowChapterId: generateChapterId('yellow'),
  name: '',
  color: '#FFD700',
  linkedBlueChapterId: blueChapterId,
  linkedRangeIds: [],
  isLive: false,
  createdAt: new Date().toISOString(),
});
