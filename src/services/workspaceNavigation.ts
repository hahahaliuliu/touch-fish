export interface PageNavigationOptions {
  currentIndex: number;
  workspaceSize: number;
  rangeStart: number;
  rangeEnd: number;
  navigationLoop: boolean;
}

export function getNextPageIndex(options: PageNavigationOptions): number {
  const nextIndex = options.currentIndex + options.workspaceSize;

  if (nextIndex < options.rangeEnd) {
    return nextIndex;
  }

  return options.navigationLoop ? options.rangeStart : options.currentIndex;
}

export function getPreviousPageIndex(options: PageNavigationOptions): number {
  const previousIndex = options.currentIndex - options.workspaceSize;

  if (previousIndex >= options.rangeStart) {
    return previousIndex;
  }

  if (!options.navigationLoop) {
    return options.currentIndex;
  }

  return getLastPageStart(options.rangeStart, options.rangeEnd, options.workspaceSize);
}

function getLastPageStart(rangeStart: number, rangeEnd: number, workspaceSize: number): number {
  const rangeLength = rangeEnd - rangeStart;
  return rangeStart + Math.floor((rangeLength - 1) / workspaceSize) * workspaceSize;
}
