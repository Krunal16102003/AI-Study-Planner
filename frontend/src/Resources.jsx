import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileText, Video, PlayCircle, Bookmark, ChevronRight, Search, Filter, Brain, ArrowUpRight } from "lucide-react";
import { api } from "./services/api";
import ErrorScreen from "./components/ErrorScreen";

export default function Resources() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ subject: "all", search: "", platform: "all", difficulty: "all" });
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get("/resources/dashboard/")
      .then(res => setData(res.data))
      .catch(err => setError(formatApiError(err, "Failed to connect to the study engine.")))
      .finally(() => setLoading(false));
  }, []);

  const filteredResources = useMemo(() => {
    if (!data) return [];
    const list = data.all_resources || data.resources || [];
    return list.filter(r => {
      const matchesSubject = filter.subject === "all" || String(r.subject_id || r.subject) === filter.subject;
      const matchesSearch = String(r.title || "").toLowerCase().includes(filter.search.toLowerCase());
      const matchesPlatform = filter.platform === "all" || r.platform === filter.platform;
      const matchesDifficulty = filter.difficulty === "all" || r.difficulty_level === filter.difficulty;
      return matchesSubject && matchesSearch && matchesPlatform && matchesDifficulty;
    });
  }, [data, filter]);

  if (loading) return <div className="loading-shimmer">Initializing AI Workspace...</div>;

  if (error || !data || !data.stats) return (
    <ErrorScreen 
      type="sync"
      title="We couldn’t sync your study data"
      detail={error || "A learning module got temporarily disconnected."}
      onRetry={() => window.location.reload()}
    />
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="resources-workspace"
    >
      {/* Header Quick Stats */}
      <header className="resources-header grid four gap-4 mb-8">
        <StatCard label="Total Materials" value={data.stats?.total || 0} icon={<FileText />} color="blue" />
        <StatCard label="In Progress" value={data.stats?.pending || 0} icon={<PlayCircle />} color="orange" />
        <StatCard label="AI Recommended" value={data.ai_recommendations.length} icon={<Sparkles />} color="purple" />
        <StatCard label="Weak Topics" value={data.stats?.weak_topics_count || 0} icon={<Brain />} color="red" />
      </header>

      <div className="workspace-layout">
        {/* Main Content Area */}
        <div className="workspace-main">
          {/* Filter Bar */}
          <section className="panel glass mb-6 p-4 flex items-center justify-between">
            <div className="flex gap-4 flex-grow">
              <div className="search-input-wrapper">
                <Search size={18} />
                <input 
                  placeholder="Search resources..." 
                  value={filter.search} 
                  onChange={e => setFilter({...filter, search: e.target.value})}
                />
              </div>
              <select 
                className="premium-select"
                value={filter.subject} 
                onChange={e => setFilter({...filter, subject: e.target.value})}
              >
                <option value="all">All Subjects</option>
                {data.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="tabs flex gap-2">
              {["all", "high", "medium", "weak"].map(t => (
                <button 
                  key={t}
                  className={`tab-btn ${activeTab === t ? "active" : ""}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </section>

          {/* Resource Grid */}
          <section className="resource-grid">
            <AnimatePresence mode="popLayout">
              {filteredResources.map((res, idx) => (
                <ResourceCard key={res.id} resource={res} index={idx} />
              ))}
            </AnimatePresence>
          </section>
        </div>

        {/* AI Sidebar */}
        <aside className="workspace-side">
          <motion.section 
            className="panel glass ai-panel p-5 mb-6"
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="flex items-center gap-2 mb-4 text-gradient">
              <Sparkles size={20} /> AI Study Recommendation
            </h3>
            <div className="ai-suggestion-list">
              {data.ai_recommendations.slice(0, 3).map((rec, i) => (
                <div key={i} className="ai-suggestion-item">
                  <div className={`urgency-dot ${rec.urgency}`}></div>
                  <p><strong>{rec.topic}</strong>: {rec.description}</p>
                </div>
              ))}
            </div>
            <button className="premium-btn w-full mt-4">Generate Quiz</button>
          </motion.section>

          <section className="panel glass p-5">
            <h3 className="mb-4">Upcoming Revisions</h3>
            {data.revision_tasks.map((task, i) => (
              <div key={i} className="revision-mini-card">
                <span>{task.subject}</span>
                <p>{task.topic}</p>
                <small>Due: {task.date}</small>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`panel stat-glass stat-${color} p-4 flex items-center gap-4`}
    >
      <div className="stat-icon">{icon}</div>
      <div>
        <span className="text-xs uppercase opacity-70 font-semibold">{label}</span>
        <h2 className="text-2xl font-bold">{value}</h2>
      </div>
    </motion.div>
  );
}

function ResourceCard({ resource, index }) {
  const resourceUrl = resource.url || resource.resource_url || "";
  const typeIcon = resourceUrl.includes("youtube") || resource.platform === "YouTube" ? <Video size={20} /> : <FileText size={20} />;
  
  return (
    <motion.article 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="panel resource-card-premium"
    >
      <div className="card-header flex justify-between items-start mb-4">
        <div className="type-badge">{typeIcon}</div>
        <button className="ghost-btn"><Bookmark size={18} /></button>
      </div>
      
      <div className="card-body mb-4">
        <span className="subject-label">{resource.subject_name}</span>
        <h3 className="resource-title">{resource.title}</h3>
        <p className="resource-meta">
          Difficulty: <span className={resource.understanding_level}>{resource.understanding_level}</span>
        </p>
      </div>

      <div className="card-footer">
        <div className="progress-mini mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{resource.is_completed ? "100%" : "0%"}</span>
          </div>
          <div className="progress-bar-bg">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: resource.is_completed ? "100%" : "0%" }}
              className="progress-bar-fill"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            className="premium-btn flex-grow py-2 text-sm"
            onClick={() => resourceUrl && window.open(resourceUrl, '_blank', 'noopener,noreferrer')}
          >
            {resource.is_completed ? "Review" : "Start Learning"}
          </button>
          <button className="secondary-btn p-2" onClick={() => resourceUrl && window.open(resourceUrl, '_blank', 'noopener,noreferrer')}>
            <ArrowUpRight size={18} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
