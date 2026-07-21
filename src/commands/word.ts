import { startSettingSession } from "../session/settingSession.js";
import { listVocabularyBooks } from "../services/vocabularyLoader.js";

export async function startWordCommand() {
  if (listVocabularyBooks().length === 0) {
    console.log("[INFO] no vocabulary book is installed; opening Settings");
    startSettingSession();
    return;
  }

  const { startWordSession } = await import("../session/wordSession.js");
  startWordSession();
}
