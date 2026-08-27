/**
 * Find the index of the last item whose startOffset is at or below the target
 * character offset. The input must be sorted by startOffset in ascending order.
 *
 * This is a binary search (O(log n)) because page, chapter and section offsets
 * are all strictly increasing, while a linear scan would be O(n) per lookup.
 */
export function findLastIndexAtOrBelow(
  items: readonly { startOffset: number }[],
  characterOffset: number
): number {
  if (items.length === 0) {
    return 0;
  }

  const target = Math.max(0, Math.floor(characterOffset));
  let low = 0;
  let high = items.length - 1;
  let result = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    if (items[mid]!.startOffset <= target) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
}
