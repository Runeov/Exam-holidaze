import { Buttons } from "./Buttons";
import { Colors } from "./Colors";
import { TextBoxes } from "./TextBoxes"; // ⬅️ new
import { Typography } from "./Typography";

// import { ThemePreviews } from "./ThemePreviews";

export default function StyleGuidePage() {
  return (
    <div className="p-12 space-y-8 bg-[--color-muted] min-h-screen">
      <h1 className="text-3xl font-bold text-[--color-text]">🧾 Style Guide</h1>
      <p className="text-[--color-text-muted]">
        This page previews the design system in use — including colors, typography, and interactive
        elements.
      </p>
      <Colors />
      <Typography />
      <Buttons />
      <TextBoxes /> {/* ⬅️ new section */}
      {/* Optional: Only if dark theme is supported */}
      {/* <ThemePreviews /> */}
    </div>
  );
}
