/**
 * Size format helpers.
 */
// Format bytes to a human-readable string.
export const formatBytes = (bytes: number | null) => {
  if (bytes === null || bytes === 0) {
    return "0";
  }

  // Choose a suitable unit, including PB.
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // For hardware specs, integer or 1 decimal is enough.
  if (unitIndex <= 1) {
    // B and KB as integers.
    return Math.round(size) + " " + units[unitIndex];
  } else {
    // MB+ with up to 1 decimal, trim trailing zero.
    const rounded = parseFloat(size.toFixed(1));
    return rounded + " " + units[unitIndex];
  }
};

/**
 * Format MB to a human-readable string (memory/VRAM).
 */
export const formatMB = (mb: number | null) => {
  if (mb === null || mb === 0) {
    return "0";
  }

  // Choose a suitable unit for memory/VRAM sizes.
  const units = ["MB", "GB", "TB"];
  let size = mb;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  const rounded = parseFloat(size.toFixed(1));
  return rounded + " " + units[unitIndex];
};
