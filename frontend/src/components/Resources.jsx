import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Sparkles, FileText, Video, PlayCircle, Bookmark, Search, Brain, ArrowUpRight, AlertCircle } from "lucide-react";
import { api, getApiErrorMessage } from "../services/api";

export default function Resources() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ subject: "all", search: "", platform: "all", difficulty: "all" });
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    setLoading(true);
    api.get("/resources/dashboard/")
      .then(res => setData(res.data))
      .catch(err => setError(getApiErrorMessage(err, "Failed to connect to the study engine.")))
      .finally(() => setLoading(false));
  }, []);

  // Mock data for fallback when API fails or is empty, now richer
  const mockData = useMemo(() => ({
    stats: { total_materials: 8, completed: 2, in_progress: 6, recommended: 3, weak_topics: 2 },
    ai_recommendations: [
      { id: "mock-ai-1", subject: "Physics", topic: "Quantum Mechanics", type: "video", ai_badge: "Weak Topic Focus", title: "Physics: Quantum Mechanics Lecture (Medium Level)", description: "A medium-level video covering Quantum Mechanics for Physics.", url: "https://www.youtube.com/watch?v=mock1", platform: "YouTube", duration: "45 min", difficulty_level: "medium", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg" },
      { id: "mock-ai-2", subject: "ReactJS", topic: "Hooks", type: "article", ai_badge: "High Priority: Intensive Study", title: "ReactJS Hooks Guide on MDN Web Docs", description: "A hard-level article covering Hooks for ReactJS.", url: "https://developer.mozilla.org/en-US/docs/Web/React/Hooks", platform: "MDN Web Docs", duration: "20 min read", difficulty_level: "hard", thumbnail: "https://via.placeholder.com/150/FF0000/FFFFFF?text=MDN" },
      { id: "mock-ai-3", subject: "DSA", topic: "Binary Trees", type: "practice", ai_badge: "Near Exam: Rapid Revision", title: "DSA Binary Trees Problems on LeetCode", description: "An easy-level practice covering Binary Trees for DSA.", url: "https://leetcode.com/problemset/all/", platform: "LeetCode", duration: "60 min session", difficulty_level: "easy", thumbnail: "https://via.placeholder.com/150/00FF00/FFFFFF?text=LC" },
    ],
    revision_tasks: [
      { subject: "Physics", topic: "Electromagnetism", date: "2026-05-15", reason: "Medium topic spaced after 3 day(s)" },
      { subject: "Math", topic: "Linear Algebra", date: "2026-05-16", reason: "Weak topic spaced after 1 day(s)" },
    ],
    all_resources: [
      { id: "mock-res-1", subject_id: 1, subject_name: "Physics", title: "Quantum Mechanics Explained (YouTube)", understanding_level: "weak", url: "https://www.youtube.com/watch?v=mock1", platform: "YouTube", type: "video", duration: "45 min", difficulty_level: "medium", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg", ai_badge: "Weak Topic Focus", is_completed: false, priority: "high" },
      { id: "mock-res-2", subject_id: 2, subject_name: "Math", title: "Calculus Integrals Course (Coursera)", understanding_level: "medium", url: "https://www.coursera.org/learn/calculus", platform: "Coursera", type: "course", duration: "10 hours", difficulty_level: "hard", thumbnail: "https://via.placeholder.com/150/0000FF/FFFFFF?text=CS" , ai_badge: "High Priority", is_completed: false, priority: "high" },
      { id: "mock-res-3", subject_id: 1, subject_name: "Physics", title: "Electromagnetism Revision Notes (User Notes)", understanding_level: "strong", url: "https://example.com/notes/em", platform: "User Notes", type: "notes", duration: "N/A", difficulty_level: "easy", thumbnail: "https://via.placeholder.com/150/CCCCCC/000000?text=Notes", ai_badge: "Your Custom Resource", is_completed: true, priority: "low" },
      { id: "mock-res-4", subject_id: 3, subject_name: "Chemistry", title: "Organic Chemistry Basics (freeCodeCamp)", understanding_level: "weak", url: "https://www.freecodecamp.org/news/organic-chem", platform: "freeCodeCamp", type: "article", duration: "30 min read", difficulty_level: "beginner", thumbnail: "https://via.placeholder.com/150/FF0000/FFFFFF?text=FCC", ai_badge: "Weak Topic Focus", is_completed: false, priority: "high" },
      { id: "mock-res-5", subject_id: 2, subject_name: "Math", title: "Algebraic Equations Practice (HackerRank)", understanding_level: "medium", url: "https://www.hackerrank.com/domains/tutorials/algebra", platform: "HackerRank", type: "practice", duration: "60 min session", difficulty_level: "medium", thumbnail: "https://via.placeholder.com/150/00FF00/FFFFFF?text=HR", ai_badge: "Balanced Study", is_completed: true, priority: "medium" },
      { id: "mock-res-6", subject_id: 1, subject_name: "Physics", title: "Thermodynamics Crash Course (YouTube)", understanding_level: "medium", url: "https://www.youtube.com/watch?v=mock2", platform: "YouTube", type: "video", duration: "90 min", difficulty_level: "medium", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg", ai_badge: "Near Exam: Rapid Revision", is_completed: false, priority: "high" },
      { id: "mock-res-7", subject_id: 3, subject_name: "Chemistry", title: "Chemical Bonding Course (edX)", understanding_level: "strong", url: "https://www.edx.org/course/chem-bond", platform: "edX", type: "course", duration: "8 hours", difficulty_level: "advanced", thumbnail: "https://via.placeholder.com/150/0000FF/FFFFFF?text=EX", ai_badge: "Trending", is_completed: false, priority: "medium" },
      { id: "mock-res-8", subject_id: 2, subject_name: "Math", title: "Probability & Statistics (Khan Academy)", understanding_level: "weak", url: "https://www.khanacademy.org/math/probability", platform: "Khan Academy", type: "course", duration: "12 hours", difficulty_level: "beginner", thumbnail: "https://via.placeholder.com/150/0000FF/FFFFFF?text=KA", ai_badge: "Weak Topic Focus", is_completed: false, priority: "high" },
    ],
    subjects: [
      { id: 1, name: "Physics" },
      { id: 2, name: "Math" },
      { id: 3, name: "Chemistry" },
      { id: 4, name: "Computer Science" },
    ],
    weak_areas: [
      { subject: "Physics", risk: 75, weak_topics: ["Quantum Mechanics"] },
      { subject: "Math", risk: 60, weak_topics: ["Calculus Integrals"] },
    ]
  }), []);

  const currentData = data || mockData;

  const filteredResources = useMemo(() => {
    const list = currentData.all_resources || currentData.resources || [];
    return list.filter(r => {
      const subjectId = String(r.subject_id); // Use subject_id from the new resource structure
      const matchesSubject = filter.subject === "all" || subjectId === filter.subject;
      const matchesSearch = String(r.title || "").toLowerCase().includes(filter.search.toLowerCase());
      
      const matchesPlatform = filter.platform === "all" || r.platform === filter.platform;
      const matchesDifficulty = filter.difficulty === "all" || r.difficulty_level === filter.difficulty;

      // Tab filtering logic
      const matchesTab = activeTab === "all" ||
                         (activeTab === "high" && r.ai_badge?.includes("High Priority")) ||
                         (activeTab === "medium" && r.ai_badge?.includes("Balanced Study")) ||
                         (activeTab === "weak" && r.ai_badge?.includes("Weak Topic Focus"));

      return matchesSubject && matchesSearch && matchesPlatform && matchesDifficulty && matchesTab;
    });
  }, [currentData, filter, activeTab]);

  if (loading) return (
    <div className="route-skeleton">
      <div className="route-skeleton__pulse" />
      <p>Syncing AI Knowledge Base...</p>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="resources-workspace"
    >
      {/* Header Quick Stats */}
      <header className="resources-header grid four gap-4 mb-8">
        <StatCard label="Total Materials" value={currentData.stats?.total_materials ?? currentData.stats?.total ?? filteredResources.length} icon={<FileText />} color="blue" />
        <StatCard label="In Progress" value={currentData.stats?.in_progress ?? currentData.stats?.pending ?? 0} icon={<PlayCircle />} color="orange" />
        <StatCard label="AI Recommended" value={currentData.stats?.recommended ?? currentData.ai_recommendations?.length ?? 0} icon={<Sparkles />} color="purple" />
        <StatCard label="Weak Topics" value={currentData.stats?.weak_topics ?? currentData.stats?.weak_topics_count ?? 0} icon={<Brain />} color="red" />
      </header>

      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="panel glass mb-6 p-4 border-l-4 border-orange-500 flex items-center gap-3"
        >
          <AlertCircle className="text-orange-500" size={20} />
          <div className="text-sm">
            <strong className="block text-orange-400">Offline Demo Mode</strong>
            <p className="opacity-70">{error}</p>
          </div>
        </motion.div>
      )}

      <div className="workspace-layout">
        {/* Main Content Area */}
        <div className="workspace-main">
          {/* Filter Bar */}
          <section className="panel glass mb-6 p-4 flex items-center justify-between resource-filter-panel">
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
                {currentData.subjects?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select className="premium-select" value={filter.platform} onChange={e => setFilter({...filter, platform: e.target.value})}>
                <option value="all">All Platforms</option>
                <option value="YouTube">YouTube</option>
                <option value="Khan Academy">Khan Academy</option>
                <option value="GeeksforGeeks">GeeksforGeeks</option>
                <option value="freeCodeCamp">freeCodeCamp</option>
                <option value="Coursera">Coursera</option>
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
            <div className="ai-suggestion-list"> {/* Use currentData.ai_recommendations */}
              {currentData.ai_recommendations?.slice(0, 3).map((rec, i) => (
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
            {currentData.revision_tasks?.map((task, i) => (
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

/* StatCard and ResourceCard are moved outside the main component for clarity and reusability */
function StatCard({ label, value, icon, color }) {
  return (
    <div className={`panel stat-glass stat-${color} p-4 flex items-center gap-4`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <span className="text-xs uppercase opacity-70 font-semibold">{label}</span>
        <h2 className="text-2xl font-bold">{value}</h2>
      </div>
    </div>
  );
}

// New ResourceCard component with enhanced details
function ResourceCard({ resource, index }) {
  const resourceUrl = resource.url || resource.resource_url || "";
  const typeIcon = resourceUrl.includes("youtube") || resource.platform === "YouTube" ? <Video size={20} /> : <FileText size={20} />;
  const progress = resource.is_completed ? 100 : resource.progress || 0;
  const thumbnailStyle = resource.thumbnail
    ? { backgroundImage: `linear-gradient(180deg, rgba(7,18,15,0.1), rgba(7,18,15,0.82)), url(${resource.thumbnail})` }
    : undefined;
  
  return (
    <motion.article 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -6 }}
      transition={{ delay: index * 0.05 }}
      className="panel resource-card-premium"
    >
      <div className="resource-thumb" style={thumbnailStyle}>
        <div className="type-badge">{typeIcon}</div>
        {resource.ai_badge && <span className="ai-badge">{resource.ai_badge}</span>}
        <button className="ghost-btn"><Bookmark size={18} /></button>
      </div>
      
      <div className="card-body">
        <span className="subject-label">{resource.subject_name}</span>
        <h3 className="resource-title">{resource.title}</h3>
        <p className="resource-description">{resource.description}</p>
        <p className="resource-meta">
          <span className="platform-tag">{resource.platform}</span>
          {resource.channel && <span className="platform-tag">{resource.channel}</span>}
          {resource.duration && <span className="duration-tag">{resource.duration}</span>}
          {resource.difficulty_level && (
            <span className={`difficulty-tag difficulty-${resource.difficulty_level}`}>
              {resource.difficulty_level.charAt(0).toUpperCase() + resource.difficulty_level.slice(1)}
            </span>
          )}
        </p>
      </div>

      <div className="card-footer">
        <div className="progress-mini mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar-bg">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
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
