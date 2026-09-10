import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearAllPdfProgress,
  clearPdfProgress,
  computeContentDigest,
  listPdfProgressEntries,
  loadPdfProgress,
  migrateLegacyPdfProgress,
  removePdfProgressEntry,
  savePdfProgress,
} from '../../src/services/pdfProgressStore';

const base = { regionHighlights: [], readProgress: {} as Record<number, number> };

describe('pdfProgressStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('round-trips a snapshot per learner and file key', () => {
    savePdfProgress('learner-a', 'digest-aa', {
      lastPage: 3,
      bookmarks: [1, 3],
      highlights: [{ page: 2, quote: '重要结论' }],
      regionHighlights: [{ page: 1, x: 0.1, y: 0.2, width: 0.3, height: 0.1, quote: '区域' }],
      readProgress: { 1: 120, 2: 0 },
      fileName: 'math.pdf',
    });
    const loaded = loadPdfProgress('learner-a', 'digest-aa');
    expect(loaded?.lastPage).toBe(3);
    expect(loaded?.bookmarks).toEqual([1, 3]);
    expect(loaded?.highlights).toEqual([{ page: 2, quote: '重要结论' }]);
    expect(loaded?.regionHighlights).toHaveLength(1);
    expect(loaded?.readProgress[1]).toBe(120);
    expect(loaded?.savedAt).toBeGreaterThan(0);
  });

  it('isolates snapshots by learner and digest key', () => {
    savePdfProgress('learner-a', 'digest-aa', { lastPage: 2, bookmarks: [], highlights: [], ...base, fileName: 'a.pdf' });
    savePdfProgress('learner-b', 'digest-aa', { lastPage: 9, bookmarks: [], highlights: [], ...base, fileName: 'a.pdf' });
    savePdfProgress('learner-a', 'digest-bb', { lastPage: 5, bookmarks: [], highlights: [], ...base, fileName: 'b.pdf' });
    expect(loadPdfProgress('learner-a', 'digest-aa')?.lastPage).toBe(2);
    expect(loadPdfProgress('learner-b', 'digest-aa')?.lastPage).toBe(9);
    expect(loadPdfProgress('learner-a', 'digest-bb')?.lastPage).toBe(5);
  });

  it('returns null for missing or corrupt entries', () => {
    expect(loadPdfProgress('learner-a', 'digest-none')).toBeNull();
    localStorage.setItem('paper-desk.pdf-progress:learner-a:digest-bad', '{not json');
    expect(loadPdfProgress('learner-a', 'digest-bad')).toBeNull();
  });

  it('clears one entry or all entries', () => {
    savePdfProgress('learner-a', 'digest-aa', { lastPage: 1, bookmarks: [], highlights: [], ...base, fileName: 'a.pdf' });
    savePdfProgress('learner-a', 'digest-bb', { lastPage: 1, bookmarks: [], highlights: [], ...base, fileName: 'b.pdf' });
    savePdfProgress('learner-b', 'digest-aa', { lastPage: 1, bookmarks: [], highlights: [], ...base, fileName: 'a.pdf' });
    clearPdfProgress('learner-a', 'digest-aa');
    expect(loadPdfProgress('learner-a', 'digest-aa')).toBeNull();
    expect(loadPdfProgress('learner-a', 'digest-bb')).not.toBeNull();
    clearAllPdfProgress();
    expect(loadPdfProgress('learner-a', 'digest-bb')).toBeNull();
    expect(loadPdfProgress('learner-b', 'digest-aa')).toBeNull();
  });

  it('computes stable content digests and differs by content size', async () => {
    const blobA = new Blob([new Uint8Array(100).fill(1)]);
    const blobB = new Blob([new Uint8Array(200).fill(1)]);
    const a1 = await computeContentDigest({ name: 'book.pdf', size: blobA.size, slice: blobA.slice.bind(blobA) });
    const a2 = await computeContentDigest({ name: 'book.pdf', size: blobA.size, slice: blobA.slice.bind(blobA) });
    const b1 = await computeContentDigest({ name: 'book.pdf', size: blobB.size, slice: blobB.slice.bind(blobB) });
    expect(a1).toBe(a2);
    expect(a1).not.toBe(b1);
    /* jsdom 无 crypto.subtle → FNV 回退（fnv- 前缀）；真实浏览器为 16 hex 摘要 */
    expect(['fnv-', ''].some((prefix) => a1.startsWith(prefix))).toBe(true);
    if (!a1.startsWith('fnv-')) expect(a1).toHaveLength(16);
  });

  it('migrates legacy file-name keys to digest keys once', () => {
    localStorage.setItem('paper-desk.pdf-progress:learner-a:old.pdf', JSON.stringify({ lastPage: 4, bookmarks: [2], highlights: [], readProgress: {}, savedAt: 1 }));
    const migrated = migrateLegacyPdfProgress('learner-a', 'old.pdf', 'digest-cc');
    expect(migrated).toBe(1);
    expect(loadPdfProgress('learner-a', 'digest-cc')?.lastPage).toBe(4);
    expect(loadPdfProgress('learner-a', 'old.pdf')).toBeNull();
    expect(migrateLegacyPdfProgress('learner-a', 'old.pdf', 'digest-cc')).toBe(0);
  });

  it('lists entries per learner with file names and item counts', () => {
    savePdfProgress('learner-a', 'digest-aa', { lastPage: 1, bookmarks: [1], highlights: [{ page: 1, quote: 'q' }], ...base, fileName: 'a.pdf' });
    savePdfProgress('learner-b', 'digest-zz', { lastPage: 1, bookmarks: [], highlights: [], ...base, fileName: 'z.pdf' });
    const entriesA = listPdfProgressEntries('learner-a');
    expect(entriesA).toHaveLength(1);
    expect(entriesA[0].fileName).toBe('a.pdf');
    expect(entriesA[0].itemCount).toBe(2);
    expect(listPdfProgressEntries('learner-b')).toHaveLength(1);
    removePdfProgressEntry('learner-a', 'digest-aa');
    expect(listPdfProgressEntries('learner-a')).toHaveLength(0);
  });
});
