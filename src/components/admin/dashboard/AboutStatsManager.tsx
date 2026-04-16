import { AboutStatContentItem } from "../../../types/site-content";
import { createStableId, moveItem } from "./utils";

interface AboutStatsManagerProps {
  aboutStats: AboutStatContentItem[];
  setAboutStats: (next: AboutStatContentItem[]) => void;
  save: () => void;
}

export function AboutStatsManager({ aboutStats, setAboutStats, save }: AboutStatsManagerProps) {
  return (
    <article className="premium-card p-4">
      <h4 className="text-base font-bold text-white">About Stats</h4>
      <div className="mt-3 grid gap-3">
        {aboutStats.map((item, index) => (
          <div key={item.id} className="grid gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="grid gap-2 md:grid-cols-2">
              <label className="field"><span className="field-label">Label</span><input className="field-input" value={item.label} onChange={(event) => setAboutStats(aboutStats.map((row, rowIndex) => rowIndex === index ? { ...row, label: event.target.value } : row))} /></label>
              <label className="field"><span className="field-label">Value</span><input className="field-input" value={item.value} onChange={(event) => setAboutStats(aboutStats.map((row, rowIndex) => rowIndex === index ? { ...row, value: event.target.value } : row))} /></label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-ghost" onClick={() => setAboutStats(moveItem(aboutStats, index, "up"))} disabled={index === 0}>Move Up</button>
              <button type="button" className="btn-ghost" onClick={() => setAboutStats(moveItem(aboutStats, index, "down"))} disabled={index === aboutStats.length - 1}>Move Down</button>
              <button type="button" className="btn-secondary" onClick={() => setAboutStats(aboutStats.filter((_, rowIndex) => rowIndex !== index))}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={() => setAboutStats([...aboutStats, { id: createStableId("about-stat"), label: "", value: "" }])}>Add About Stat</button>
        <button type="button" className="btn-primary" onClick={save}>Save About Stats</button>
      </div>
    </article>
  );
}
