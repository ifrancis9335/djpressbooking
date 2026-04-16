import { GalleryContentItem } from "../../../types/site-content";
import { AdminImageField } from "../admin-image-field";
import { createStableId, moveItem } from "./utils";

interface DynamicGalleryManagerProps {
  gallery: GalleryContentItem[];
  setOrderedGallery: (next: GalleryContentItem[]) => void;
  save: () => void;
}

export function DynamicGalleryManager({ gallery, setOrderedGallery, save }: DynamicGalleryManagerProps) {
  return (
    <article className="premium-card p-4">
      <h4 className="text-base font-bold text-white">Dynamic Gallery</h4>
      <p className="mt-1 text-xs text-slate-400">Images upload into managed storage. Video entries continue using direct URLs.</p>
      <div className="mt-3 grid gap-3">
        {gallery.map((item, index) => (
          <div key={item.id} className="grid gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="grid gap-2 md:grid-cols-2">
              <label className="field"><span className="field-label">Media Type</span><select className="field-input" value={item.type} onChange={(event) => setOrderedGallery(gallery.map((row, rowIndex) => rowIndex === index ? { ...row, type: event.target.value === "video" ? "video" : "image" } : row))}><option value="image">Image</option><option value="video">Video</option></select></label>
              <label className="field"><span className="field-label">Title</span><input className="field-input" value={item.title || ""} onChange={(event) => setOrderedGallery(gallery.map((row, rowIndex) => rowIndex === index ? { ...row, title: event.target.value } : row))} /></label>
              <label className="field"><span className="field-label">Caption</span><input className="field-input" value={item.caption || ""} onChange={(event) => setOrderedGallery(gallery.map((row, rowIndex) => rowIndex === index ? { ...row, caption: event.target.value } : row))} /></label>
              <label className="field"><span className="field-label">Alt Text</span><input className="field-input" value={item.alt || ""} onChange={(event) => setOrderedGallery(gallery.map((row, rowIndex) => rowIndex === index ? { ...row, alt: event.target.value } : row))} /></label>
              {item.type === "video" ? (
                <label className="field md:col-span-2"><span className="field-label">Video URL</span><input className="field-input" value={item.url} onChange={(event) => setOrderedGallery(gallery.map((row, rowIndex) => rowIndex === index ? { ...row, url: event.target.value } : row))} /></label>
              ) : null}
            </div>
            {item.type === "image" ? (
              <AdminImageField
                label="Gallery Image"
                scope="gallery"
                uploadTitle={item.title || item.caption || `Gallery ${index + 1}`}
                fallbackSrc="/images/branding/dj-press-logo-press.png"
                value={item.imageAsset}
                legacyUrl={item.url}
                previewClassName="h-28 w-full rounded-xl object-cover"
                onChange={(next) => setOrderedGallery(gallery.map((row, rowIndex) => rowIndex === index ? { ...row, imageAsset: next, url: next?.url || "/images/branding/dj-press-logo-press.png" } : row))}
                onLegacyClear={() => setOrderedGallery(gallery.map((row, rowIndex) => rowIndex === index ? { ...row, url: "/images/branding/dj-press-logo-press.png" } : row))}
              />
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-ghost" onClick={() => setOrderedGallery(moveItem(gallery, index, "up"))} disabled={index === 0}>Move Up</button>
              <button type="button" className="btn-ghost" onClick={() => setOrderedGallery(moveItem(gallery, index, "down"))} disabled={index === gallery.length - 1}>Move Down</button>
              <button type="button" className="btn-secondary" onClick={() => setOrderedGallery(gallery.filter((_, rowIndex) => rowIndex !== index))}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={() => setOrderedGallery([...gallery, { id: createStableId("gallery"), url: "/images/branding/dj-press-logo-press.png", type: "image", title: "", caption: "", alt: "", imageAsset: undefined, order: gallery.length }])}>Add Gallery Item</button>
        <button type="button" className="btn-primary" onClick={save}>Save Gallery</button>
      </div>
    </article>
  );
}
