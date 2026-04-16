import { ReviewContentItem } from "../../../types/site-content";
import { createStableId, moveItem } from "./utils";

interface DynamicReviewsManagerProps {
  reviews: ReviewContentItem[];
  setReviews: (next: ReviewContentItem[]) => void;
  save: () => void;
}

export function DynamicReviewsManager({ reviews, setReviews, save }: DynamicReviewsManagerProps) {
  return (
    <article className="premium-card p-4">
      <h4 className="text-base font-bold text-white">Dynamic Reviews</h4>
      <div className="mt-3 grid gap-3">
        {reviews.map((item, index) => (
          <div key={item.id} className="grid gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="grid gap-2 md:grid-cols-2">
              <label className="field"><span className="field-label">Name</span><input className="field-input" value={item.name} onChange={(event) => setReviews(reviews.map((row, rowIndex) => rowIndex === index ? { ...row, name: event.target.value } : row))} /></label>
              <label className="field"><span className="field-label">Rating (1-5)</span><input className="field-input" type="number" min={1} max={5} value={item.rating} onChange={(event) => setReviews(reviews.map((row, rowIndex) => rowIndex === index ? { ...row, rating: Number(event.target.value) || 5 } : row))} /></label>
              <label className="field md:col-span-2"><span className="field-label">Review Text</span><textarea className="field-input min-h-[90px]" value={item.text} onChange={(event) => setReviews(reviews.map((row, rowIndex) => rowIndex === index ? { ...row, text: event.target.value } : row))} /></label>
              <label className="field"><span className="field-label">Approved</span><select className="field-input" value={item.approved ? "yes" : "no"} onChange={(event) => setReviews(reviews.map((row, rowIndex) => rowIndex === index ? { ...row, approved: event.target.value === "yes" } : row))}><option value="yes">Yes</option><option value="no">No</option></select></label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-ghost" onClick={() => setReviews(moveItem(reviews, index, "up"))} disabled={index === 0}>Move Up</button>
              <button type="button" className="btn-ghost" onClick={() => setReviews(moveItem(reviews, index, "down"))} disabled={index === reviews.length - 1}>Move Down</button>
              <button type="button" className="btn-secondary" onClick={() => setReviews(reviews.filter((_, rowIndex) => rowIndex !== index))}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={() => setReviews([...reviews, { id: createStableId("review"), name: "", rating: 5, text: "", approved: true }])}>Add Review</button>
        <button type="button" className="btn-primary" onClick={save}>Save Reviews</button>
      </div>
    </article>
  );
}
