import { AlertTriangle } from "lucide-react";

export default function DeleteConfirmationModal({ plan, onCancel, onConfirm }) {
  if (!plan) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="panel planning-modal planning-modal--danger" role="dialog" aria-modal="true">
        <AlertTriangle size={34} />
        <h2>Delete study plan?</h2>
        <p>
          This will permanently remove <strong>{plan.title}</strong> and its study sessions. This action cannot be undone.
        </p>
        <div className="planning-modal__actions">
          <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="danger-button" onClick={() => onConfirm(plan)}>Delete Plan</button>
        </div>
      </section>
    </div>
  );
}
