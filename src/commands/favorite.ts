export async function startFavoriteCommand() {
  const { startFavoriteSession } = await import("../session/favoriteSession.js");
  startFavoriteSession();
}
