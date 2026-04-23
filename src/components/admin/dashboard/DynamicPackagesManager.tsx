"use client";

import { PackageContentItem } from "../../../types/site-content";
import { AdminImageField } from "../admin-image-field";
import { createStableId, moveItem } from "./utils";

interface DynamicPackagesManagerProps {
  packages: PackageContentItem[];
  setOrderedPackages: (next: PackageContentItem[]) => void;
  save: () => void;
}

export function DynamicPackagesManager({ packages, setOrderedPackages, save }: DynamicPackagesManagerProps) {
  const invalidPackages = packages.filter((item) => !item.name.trim() || !item.price.trim() || !item.description.trim());

  return (
    <article className="premium-card p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="text-base font-bold text-white">Managed Package Manager</h4>
          <p className="mt-1 text-sm text-slate-300">Create, edit, hide, feature, and reorder the public DJ package lineup.</p>
        </div>
        <div className="text-xs text-slate-400">
          <p>{packages.filter((item) => item.visible).length} visible</p>
          <p>{packages.length} total</p>
        </div>
      </div>
      <div className="mt-3 grid gap-3">
        {packages.map((item, index) => (
          <div key={item.id} className="grid gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-400">
              <span>Display Order {index + 1}</span>
              <span>{item.visible ? "Visible" : "Hidden"}</span>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <label className="field"><span className="field-label">Package Name</span><input className="field-input" value={item.name} onChange={(event) => setOrderedPackages(packages.map((row, rowIndex) => rowIndex === index ? { ...row, name: event.target.value } : row))} /></label>
              <label className="field"><span className="field-label">Price</span><input className="field-input" value={item.price} onChange={(event) => setOrderedPackages(packages.map((row, rowIndex) => rowIndex === index ? { ...row, price: event.target.value } : row))} /></label>
              <label className="field md:col-span-2"><span className="field-label">Short Description</span><textarea className="field-input min-h-[84px]" value={item.description} onChange={(event) => setOrderedPackages(packages.map((row, rowIndex) => rowIndex === index ? { ...row, description: event.target.value } : row))} /></label>
              <label className="field md:col-span-2"><span className="field-label">Feature List (one per line)</span><textarea className="field-input min-h-[90px]" value={item.features.join("\n")} onChange={(event) => setOrderedPackages(packages.map((row, rowIndex) => rowIndex === index ? { ...row, features: event.target.value.split("\n").map((feature) => feature.trim()).filter(Boolean) } : row))} /></label>
              <label className="field"><span className="field-label">Featured Package</span><select className="field-input" value={item.highlight ? "yes" : "no"} onChange={(event) => setOrderedPackages(packages.map((row, rowIndex) => rowIndex === index ? { ...row, highlight: event.target.value === "yes" } : row))}><option value="no">No</option><option value="yes">Yes</option></select></label>
              <label className="field"><span className="field-label">Public Visibility</span><select className="field-input" value={item.visible ? "yes" : "no"} onChange={(event) => setOrderedPackages(packages.map((row, rowIndex) => rowIndex === index ? { ...row, visible: event.target.value === "yes" } : row))}><option value="yes">Visible</option><option value="no">Hidden</option></select></label>
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
            {!item.name.trim() || !item.price.trim() || !item.description.trim() ? (
              <p className="status-bad">Each package needs a name, price, and short description before it can be saved.</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-ghost" onClick={() => setOrderedPackages(moveItem(packages, index, "up"))} disabled={index === 0}>Move Up</button>
              <button type="button" className="btn-ghost" onClick={() => setOrderedPackages(moveItem(packages, index, "down"))} disabled={index === packages.length - 1}>Move Down</button>
              <button type="button" className="btn-secondary" onClick={() => setOrderedPackages(packages.filter((_, rowIndex) => rowIndex !== index))}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {invalidPackages.length > 0 ? <p className="status-bad mt-3">Complete the required package fields before saving.</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={() => setOrderedPackages([...packages, { id: createStableId("package"), name: "", price: "", description: "", features: [], highlight: false, visible: true, imageAsset: undefined, order: packages.length }])}>Add Package</button>
        <button type="button" className="btn-primary" onClick={save} disabled={invalidPackages.length > 0}>Save Packages</button>
      </div>
    </article>
  );
}
