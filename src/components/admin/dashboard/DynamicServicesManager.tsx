import { SiteContent, ServiceContentItem } from "../../../types/site-content";
import { AdminImageField } from "../admin-image-field";
import { createStableId, moveItem } from "./utils";

interface DynamicServicesManagerProps {
  services: SiteContent["services"];
  setOrderedServices: (next: ServiceContentItem[]) => void;
  save: () => void;
}

export function DynamicServicesManager({ services, setOrderedServices, save }: DynamicServicesManagerProps) {
  return (
    <article className="premium-card p-4">
      <h4 className="text-base font-bold text-white">Dynamic Services</h4>
      <div className="mt-3 grid gap-3">
        {services.map((item, index) => (
          <div key={item.id} className="grid gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="grid gap-2 md:grid-cols-2">
              <label className="field"><span className="field-label">Title</span><input className="field-input" value={item.title} onChange={(event) => setOrderedServices(services.map((row, rowIndex) => rowIndex === index ? { ...row, title: event.target.value } : row))} /></label>
              <label className="field"><span className="field-label">Icon (optional)</span><input className="field-input" value={item.icon || ""} onChange={(event) => setOrderedServices(services.map((row, rowIndex) => rowIndex === index ? { ...row, icon: event.target.value } : row))} /></label>
              <label className="field md:col-span-2"><span className="field-label">Description</span><input className="field-input" value={item.description} onChange={(event) => setOrderedServices(services.map((row, rowIndex) => rowIndex === index ? { ...row, description: event.target.value } : row))} /></label>
            </div>
            <AdminImageField
              label="Service Image"
              scope="services"
              uploadTitle={item.title || `Service ${index + 1}`}
              fallbackSrc="/images/dj/dj-press-live-performance.jpg"
              value={item.imageAsset}
              legacyUrl={item.image}
              previewClassName="h-28 w-full rounded-xl object-cover"
              onChange={(next) => setOrderedServices(services.map((row, rowIndex) => rowIndex === index ? { ...row, imageAsset: next, image: "" } : row))}
              onLegacyClear={() => setOrderedServices(services.map((row, rowIndex) => rowIndex === index ? { ...row, image: "" } : row))}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-ghost" onClick={() => setOrderedServices(moveItem(services, index, "up"))} disabled={index === 0}>Move Up</button>
              <button type="button" className="btn-ghost" onClick={() => setOrderedServices(moveItem(services, index, "down"))} disabled={index === services.length - 1}>Move Down</button>
              <button type="button" className="btn-secondary" onClick={() => setOrderedServices(services.filter((_, rowIndex) => rowIndex !== index))}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={() => setOrderedServices([...services, { id: createStableId("service"), title: "", description: "", icon: "", image: "", imageAsset: undefined, order: services.length }])}>Add Service</button>
        <button type="button" className="btn-primary" onClick={save}>Save Services</button>
      </div>
    </article>
  );
}
