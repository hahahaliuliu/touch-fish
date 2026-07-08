import type { Settings } from "../models/settings.js";

export function renderSettingSession(settings: Settings) {
  console.clear();

  console.log("[INFO] loading workspace configuration...");
  console.log("[INFO] resolving local settings...");
  console.log("[INFO] configuration ready");
  console.log("");
  console.log("settings");
  console.log(`  workspace size        ${settings.workspaceSize}`);
  console.log(`  display mode          ${settings.displayMode}`);
  console.log(`  study order           ${settings.studyOrder}`);
  console.log(`  theme                 ${settings.theme}`);
  console.log(`  active vocabulary     ${settings.activeVocabularyBook}`);
  console.log(`  daily word count      ${settings.dailyWordCount}`);
  console.log("");
  console.log("visible fields");
  console.log(`  phonetic              ${formatBoolean(settings.visibleFields.phonetic)}`);
  console.log(`  example               ${formatBoolean(settings.visibleFields.example)}`);
  console.log(
    `  part of speech        ${formatBoolean(settings.visibleFields.partOfSpeech)}`
  );
  console.log(`  note                  ${formatBoolean(settings.visibleFields.note)}`);
  console.log(`  tags                  ${formatBoolean(settings.visibleFields.tags)}`);
  console.log("");
  console.log("key bindings");
  console.log(`  previous              ${settings.keyBindings.previous}`);
  console.log(`  next                  ${settings.keyBindings.next}`);
  console.log(`  repeat                ${settings.keyBindings.repeat}`);
  console.log(
    `  switch display mode   ${settings.keyBindings.switchDisplayMode}`
  );
  console.log(`  toggle help           ${settings.keyBindings.toggleHelp}`);
  console.log(`  quit                  ${settings.keyBindings.quit}`);
  console.log("");
  console.log("[INFO] read-only settings view");
  console.log("press ctrl+o to return");
  console.log("press q to exit");
}

function formatBoolean(value: boolean) {
  return value ? "enabled" : "disabled";
}
