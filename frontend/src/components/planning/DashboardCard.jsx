export default function DashboardCard({ as: Element = "section", className = "", children, ...props }) {
  return (
    <Element className={`panel dashboard-card ${className}`.trim()} {...props}>
      {children}
    </Element>
  );
}
