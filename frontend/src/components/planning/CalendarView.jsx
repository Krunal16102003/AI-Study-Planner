export default function CalendarView({ sessions, onDragStart, onDropSession }) {
  const days = Array.from(
    sessions.reduce((set, session) => set.add(session.date), new Set())
  ).sort().slice(0, 14);

  return (
    <section className="panel planning-calendar">
      <div className="planning-section-title">
        <h2>Calendar View</h2>
        <span>{days.length} scheduled day(s)</span>
      </div>
      <div className="planning-calendar__grid">
        {days.length ? days.map(day => (
          <div
            className="planning-calendar__day"
            key={day}
            onDragOver={event => event.preventDefault()}
            onDrop={event => onDropSession(event, day)}
          >
            <strong>{day}</strong>
            {sessions.filter(session => session.date === day).slice(0, 4).map(session => (
              <button
                className={`planning-calendar__task ${session.is_completed ? "is-done" : ""}`}
                draggable
                type="button"
                key={session.id}
                onDragStart={event => onDragStart(event, session.id)}
                title="Drag to rearrange this study task"
              >
                {session.start_time?.slice(0, 5)} {session.title}
              </button>
            ))}
          </div>
        )) : <p className="empty">Generate or add a study plan to see scheduled sessions.</p>}
      </div>
    </section>
  );
}
