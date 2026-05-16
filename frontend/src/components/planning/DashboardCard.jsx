export default function DashboardCard({
  as: Element = "section",
  className = "",
  children,
  eyebrow,
  title,
  action,
  tone = "default",
  compact = false,
  ...props
}) {
  return (
    <Element className={`panel dashboard-card dashboard-card--${tone} ${compact ? "dashboard-card--compact" : ""} ${className}`.trim()} {...props}>
      {(eyebrow || title || action) && (
        <header className="dashboard-card__header">
          <div>
            {eyebrow && <span className="dashboard-card__eyebrow">{eyebrow}</span>}
            {title && <h2>{title}</h2>}
          </div>
          {action && <div className="dashboard-card__action">{action}</div>}
        </header>
      )}
      {children}
    </Element>
  );
}
