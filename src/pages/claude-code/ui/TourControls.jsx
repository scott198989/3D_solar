import { Route, ChevronLeft, ChevronRight, X, Play } from "lucide-react";

// Guided-tour controls. The narration caption is rendered separately (bottom
// centre) by the HUD; this panel drives start/stop/step.
export default function TourControls({ ui, api }) {
  if (!ui) return null;
  const tour = ui.tour || {};
  return (
    <section className="cc-panel">
      <header className="cc-panel-h">
        <Route size={14} aria-hidden="true" />
        <span>Guided tour</span>
      </header>
      {!tour.active ? (
        <button className="cc-btn cc-wide" onClick={() => api.startTour()}>
          <Play size={15} aria-hidden="true" />
          <span>Start the tour</span>
        </button>
      ) : (
        <div className="cc-tour-active">
          <div className="cc-tour-meta">
            <strong>{tour.title}</strong>
            <span>
              {tour.index + 1} / {tour.total}
            </span>
          </div>
          <div className="cc-row cc-tour-nav">
            <button className="cc-btn cc-iconbtn" onClick={() => api.tourPrev()} title="Previous">
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <button className="cc-btn cc-iconbtn" onClick={() => api.tourNext()} title="Next">
              <ChevronRight size={16} aria-hidden="true" />
            </button>
            <button className="cc-btn cc-iconbtn" onClick={() => api.stopTour()} title="End tour">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
