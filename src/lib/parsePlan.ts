export interface Task {
  id: string;
  text: string;
  isComplete: boolean;
  isBlocked: boolean;
}

/**
 * Generates a cryptographically secure UUID, falling back to a pseudo-random generator
 * if the runtime environment does not expose crypto.randomUUID.
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Safe pseudo-random fallback to avoid compilation/runtime failures
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Parses a markdown string, extracting lines that start with bullets (- or *) or
 * numbers (e.g. 1., 2.) as Task items.
 */
export function parsePlanToTasks(markdown: string): Task[] {
  if (!markdown) return [];

  const lines = markdown.split(/\r?\n/);
  const tasks: Task[] = [];

  // Match optional whitespace, followed by bullet (- or *) or number (digits followed by dot),
  // followed by one or more spaces and the actual content.
  const prefixRegex = /^\s*([-*]|\d+\.)\s+(.+)$/;

  for (const line of lines) {
    const match = prefixRegex.exec(line);
    if (match) {
      const text = match[2].trim();
      // Filter out empty lines or divider lines
      if (text && !text.startsWith('---') && !text.startsWith('***')) {
        tasks.push({
          id: generateUUID(),
          text,
          isComplete: false,
          isBlocked: false,
        });
      }
    }
  }

  return tasks;
}
