export type RankedChunk = {
  id: string;
  content: string;
  sourceId: string;
  score: number;
};

export function rrf(lists: RankedChunk[][], k = 60): RankedChunk[] {
  const scores = new Map<string, { chunk: RankedChunk; score: number }>();
  for (const list of lists) {
    list.forEach((chunk, index) => {
      const add = 1 / (k + index + 1);
      const prev = scores.get(chunk.id);
      if (prev) prev.score += add;
      else scores.set(chunk.id, { chunk, score: add });
    });
  }
  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .map((v) => ({ ...v.chunk, score: v.score }));
}
