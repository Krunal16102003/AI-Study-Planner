import { X } from "lucide-react";
import { useEffect, useState } from "react";

const emptyForm = {
  title: "",
  start_date: "",
  end_date: "",
  daily_hours: 2,
};

export default function EditPlanModal({ open, plan, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm(plan ? {
      title: plan.title || "",
      start_date: plan.start_date || "",
      end_date: plan.end_date || "",
      daily_hours: plan.daily_hours || 2,
    } : emptyForm);
  }, [plan, open]);

  if (!open) return null;

  function submit(event) {
    event.preventDefault();
    onSave({
      ...form,
      daily_hours: Number(form.daily_hours),
    });
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="panel planning-modal" onSubmit={submit}>
        <div className="planning-modal__top">
          <div>
            <h2>{plan?.id ? "Edit study plan" : "Add new study plan"}</h2>
            <p>Set the date range and daily target. Sessions, subjects, and topics appear automatically after generation.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <label>
          Plan title
          <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Final exam preparation" />
        </label>
        <div className="planning-form-grid">
          <label>
            Start date
            <input required type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
          </label>
          <label>
            End date
            <input required type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
          </label>
          <label>
            Daily study hours
            <input required type="number" min="0.5" max="12" step="0.5" value={form.daily_hours} onChange={e => setForm({ ...form, daily_hours: e.target.value })} />
          </label>
        </div>
        <div className="planning-modal__actions">
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button>{plan?.id ? "Update Plan" : "Create Plan"}</button>
        </div>
      </form>
    </div>
  );
}
