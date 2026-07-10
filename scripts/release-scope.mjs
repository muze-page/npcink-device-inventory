export const DESKTOP_RELEASE_PATHS = [
  "ele-rs/",
  "scripts/build-desktop-update-manifests.mjs",
  "scripts/check-desktop-update-manifests.mjs",
  "scripts/check-desktop-update-transition.mjs",
  "scripts/release-scope.mjs",
  "scripts/detect-release-scope.mjs",
  "scripts/check-release-scope.mjs",
  ".github/workflows/release.yml",
];

export const needsDesktopRelease = (changedPaths) =>
  changedPaths.some((filePath) =>
    DESKTOP_RELEASE_PATHS.some(
      (desktopPath) => filePath === desktopPath || filePath.startsWith(desktopPath)
    )
  );
