export interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  minChunkSize?: number;
}

export interface TextChunk {
  content: string;
  index: number;
  startChar: number;
  endChar: number;
}

const DEFAULT_CHUNK_SIZE = 800;
const DEFAULT_CHUNK_OVERLAP = 150;
const DEFAULT_MIN_CHUNK_SIZE = 50;

export function chunkText(
  text: string,
  options: ChunkOptions = {}
): TextChunk[] {
  const {
    chunkSize = DEFAULT_CHUNK_SIZE,
    chunkOverlap = DEFAULT_CHUNK_OVERLAP,
    minChunkSize = DEFAULT_MIN_CHUNK_SIZE,
  } = options;

  const cleanedText = text.replace(/\s+/g, " ").trim();

  if (cleanedText.length === 0) return [];
  if (cleanedText.length <= chunkSize) {
    return [{ content: cleanedText, index: 0, startChar: 0, endChar: cleanedText.length }];
  }

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < cleanedText.length) {
    let end = Math.min(start + chunkSize, cleanedText.length);

    if (end < cleanedText.length) {
      const sentenceBreak = findSentenceBreak(cleanedText, end, chunkSize * 0.2);
      if (sentenceBreak !== -1) end = sentenceBreak;
    }

    const content = cleanedText.slice(start, end).trim();

    if (content.length >= minChunkSize) {
      chunks.push({ content, index, startChar: start, endChar: end });
      index++;
    }

    if (end >= cleanedText.length) break;
    start = Math.max(start + 1, end - chunkOverlap);
  }

  return chunks;
}

function findSentenceBreak(
  text: string,
  near: number,
  searchWindow: number
): number {
  const windowStart = Math.max(0, near - searchWindow);
  const segment = text.slice(windowStart, near);

  const sentenceEndPattern = /[.!?]\s+/g;
  let lastMatch = -1;
  let match: RegExpExecArray | null;

  while ((match = sentenceEndPattern.exec(segment)) !== null) {
    lastMatch = windowStart + match.index + match[0].length;
  }

  if (lastMatch !== -1) return lastMatch;

  const paragraphBreak = segment.lastIndexOf("\n");
  if (paragraphBreak !== -1) return windowStart + paragraphBreak + 1;

  return -1;
}
