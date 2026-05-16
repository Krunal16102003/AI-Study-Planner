import { motion } from "framer-motion";
import { Plus, BookOpen, CalendarDays, Brain, BarChart3, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function OnboardingAnalytics() {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="onboarding-analytics-panel panel glass p-8 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="onboarding-icon-wrapper"
      >
        <Sparkles size={64} className="text-purple-400" />
      </motion.div>
      <h2 className="text-2xl font-bold mt-4 text-gradient">Welcome to your AI Study Dashboard!</h2>
      <p className="text-muted mt-2 mb-6 max-w-md mx-auto">
        It looks a little empty here, but that's because you're just getting started.
        Let's fill it with your intelligent study insights.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <OnboardingCard icon={<BookOpen size={24} />} title="Add Your Subjects" description="Define your courses and exam dates." to="/subjects" />
        <OnboardingCard icon={<CalendarDays size={24} />} title="Create Your First Plan" description="Let AI generate your daily schedule." to="/planner" />
        <OnboardingCard icon={<Brain size={24} />} title="Start a Quiz" description="Test your knowledge and find weak spots." to="/quiz" />
      </div>
      <p className="text-sm text-muted mt-8">
        As you study, complete tasks, and take quizzes, your personalized analytics will appear here.
      </p>
    </motion.div>
  );
}

function OnboardingCard({ icon, title, description, to }) {
  return (
    <Link to={to} className="panel onboarding-card">
      <div className="onboarding-card-icon">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted">{description}</p>
    </Link>
  );
}