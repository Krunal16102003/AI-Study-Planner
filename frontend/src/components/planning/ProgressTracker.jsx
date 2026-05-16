export default function ProgressTracker({ value = 0, status }) {
  const percent = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  return (
    <div className="planning-progress">
      <div className="planning-progress__meta">
        <strong>{percent}%</strong>
        {status && <span>{status}</span>}
      </div>
      <div className="planning-progress__bar" aria-label={`Completion ${percent}%`}>
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
