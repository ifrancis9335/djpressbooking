import { PackageContentItem } from "../../../types/site-content";
import { AdminImageField } from "../admin-image-field";
import { createStableId, moveItem } from "./utils";

interface DynamicPackagesManagerProps {
  packages: PackageContentItem[];
  setOrderedPackages: (next: PackageContentItem[]) => void;
  save: () => void;
}

export function DynamicPackagesManager({ packages, setOrderedPackages, save }: DynamicPackagesManagerProps) {
  return (
    <article className="premium-card p-4">
      <h4 className="text-base font-bold text-white">Dynamic Packages</h4>
      <div className="mt-3 grid gap-3">
        {packages.map((item, index) => (
          <div key={item.id} className="grid gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="grid gap-2 md:grid-cols-2">
              <label className="field"><span className="field-label">Name</span><input className="field-input" value={item.name} onChange={(event) => setOrderedPackages(packages.map((row, rowIndex) => rowIndex === index ? { ...row, name: event.target.value } : row))} /></label>
              <label className="field"><span className="field-label">Price</span><input className="field-input" value={item.price} onChange={(event) => setOrderedPackages(packages.map((row, rowIndex) => rowIndex === index ? { ...row, price: event.target.value } : row))} /></label>
              <label className="field md:col-span-2"><span className="field-label">Features (one per line)</span><textarea className="field-input min-h-[90px]" value={item.features.join("\n")} onChange={(event) => setOrderedPackages(packages.map((row, rowIndex) => rowIndex === index ? { ...row, features: event.target.value.split("\n").map((feature) => feature.trim()).filter(Boolean) } : row))} /></label>
              <label className="field"><span className="field-label">Highlight</span><select className="field-input" value={item.highlight ? "yes" : "no"} onChange={(event) => setOrderedPackages(packages.map((row, rowIndex) => rowIndex === index ? { ...row, highlight: event.target.value === "yes" } : row))}><option value="no">No</option><option value="yes">Yes</option></select></label>
            </div>
            <AdminImageField
              label="Package Image"
              scope="packages"
              uploadTitle={item.name || `Package ${index + 1}`}
              fallbackSrc="/images/dj/dj-press-live-performance.jpg"
              value={item.imageAsset}
              previewClassName="h-28 w-full rounded-xl object-cover"
              onChange={(next) => setOrderedPackages(packages.map((row, rowIndex) => rowIndex === index ? { ...row, imageAsset: next } : row))}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-ghost" onClick={() => setOrderedPackages(moveItem(packages, index, "up"))} disabled={index === 0}>Move Up</button>
              <button type="button" className="btn-ghost" onClick={() => setOrderedPackages(moveItem(packages, index, "down"))} disabled={index === packages.length - 1}>Move Down</button>
              <button type="button" className="btn-secondary" onClick={() => setOrderedPackages(packages.filter((_, rowIndex) => rowIndex !== index))}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={() => setOrderedPackages([...packages, { id: createStableId("package"), name: "", price: "", features: [], highlight: false, imageAsset: undefined, order: packages.length }])}>Add Package</button>
        <button type="button" className="btn-primary" onClick={save}>Save Packages</button>
      </div>
    </article>
  );
}
