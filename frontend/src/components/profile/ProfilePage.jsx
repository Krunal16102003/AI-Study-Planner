import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Save,
  Sparkles,
  Upload,
} from "lucide-react";
import { api, getApiErrorMessage } from "../../services/api";

const emptyProfile = {
  id: "",
  user_id: "",
  username: "",
  email: "",
  joined_at: "",
  full_name: "",
  avatar: "",
  bio: "",
  phone: "",
  date_of_birth: "",
  gender: "",
  location: "",
  timezone: "",
  language: "",
  preferred_role: "",
  experience_level: "",
  years_of_experience: "",
  primary_skills: "",
  secondary_skills: "",
  tech_stack: "",
  portfolio: "",
  github: "",
  linkedin: "",
  resume: "",
  current_company: "",
  preferred_job_type: "",
  career_goal: "",
  daily_study_hours: "2.0",
  target_exam: "",
};

const optionalFields = [
  "avatar",
  "bio",
  "phone",
  "date_of_birth",
  "gender",
  "location",
  "timezone",
  "language",
  "preferred_role",
  "experience_level",
  "years_of_experience",
  "primary_skills",
  "secondary_skills",
  "tech_stack",
  "portfolio",
  "github",
  "linkedin",
  "resume",
  "current_company",
  "preferred_job_type",
  "career_goal",
];

const profileMetrics = [
  ["Interview Readiness", 0, "Complete your skills and career goal to unlock AI scoring."],
  ["Career Confidence", 0, "Add role, experience, and portfolio details for recommendations."],
  ["Weekly Progress", 0, "Learning activity appears after you start using the planner."],
];

const activityCards = [
  ["Roadmaps", "No completed roadmaps yet", "Start a roadmap"],
  ["Streak", "No active study streak", "Build momentum"],
  ["Projects", "No portfolio projects added", "Add projects"],
  ["Interviews", "No mock interviews reviewed", "Practice now"],
  ["Certifications", "No certifications added", "Add proof"],
  ["AI Notes", "Recommendations appear after profile completion", "Pending"],
];

function normalizeProfile(data = {}) {
  return {
    ...emptyProfile,
    ...data,
    years_of_experience: data.years_of_experience ?? "",
    daily_study_hours: data.daily_study_hours ?? "2.0",
  };
}

function getDisplayName(profile, fallback) {
  return profile.full_name?.trim() || profile.username || fallback || "Student";
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase() || "U";
}

function formatJoinDate(value) {
  if (!value) return "New member";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function validateProfile(profile) {
  const errors = {};
  const urlFields = ["portfolio", "github", "linkedin"];
  urlFields.forEach(field => {
    const value = profile[field]?.trim();
    if (!value) return;
    try {
      new URL(value);
    } catch {
      errors[field] = "Use a full URL, for example https://example.com";
    }
  });

  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    errors.email = "Enter a valid email address.";
  }

  return errors;
}

export default function ProfilePage({ auth }) {
  const fileInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const basicInfoRef = useRef(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get("/auth/profile/")
      .then(({ data }) => {
        if (!active) return;
        setProfile(normalizeProfile(data));
        setFeedback("");
      })
      .catch((err) => {
        if (!active) return;
        setFeedback(getApiErrorMessage(err, "Could not load your profile."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const displayName = getDisplayName(profile, auth.username);
  const completion = useMemo(() => {
    const completed = optionalFields.filter(field => String(profile[field] || "").trim()).length;
    return Math.round((completed / optionalFields.length) * 100);
  }, [profile]);

  const skillRows = useMemo(() => {
    const skills = `${profile.primary_skills || ""},${profile.secondary_skills || ""},${profile.tech_stack || ""}`
      .split(",")
      .map(skill => skill.trim())
      .filter(Boolean);
    return skills.length ? skills.slice(0, 8) : [];
  }, [profile.primary_skills, profile.secondary_skills, profile.tech_stack]);

  function updateProfileField(name, value) {
    setProfile(current => ({ ...current, [name]: value }));
    setErrors(current => ({ ...current, [name]: "" }));
  }

  function uploadAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFeedback("Choose an image file for your avatar.");
      return;
    }
    if (file.size > 750_000) {
      setFeedback("Use an avatar image under 750 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateProfileField("avatar", String(reader.result || ""));
      setFeedback("Avatar ready. Save profile to keep it.");
    };
    reader.readAsDataURL(file);
  }

  function uploadResume(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    updateProfileField("resume", file.name);
    setFeedback("Resume filename added. Save profile to keep it.");
  }

  function startEditingProfile() {
    basicInfoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => basicInfoRef.current?.querySelector("input")?.focus(), 350);
  }

  function openPortfolio() {
    if (!profile.portfolio) {
      setFeedback("Add your portfolio URL first.");
      return;
    }
    window.open(profile.portfolio, "_blank", "noopener,noreferrer");
  }

  async function saveProfile() {
    const nextErrors = validateProfile(profile);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setFeedback("Fix the highlighted fields before saving.");
      return;
    }

    setSaving(true);
    setFeedback("");
    try {
      const { data } = await api.patch("/auth/profile/", {
        full_name: profile.full_name,
        avatar: profile.avatar,
        bio: profile.bio,
        phone: profile.phone,
        date_of_birth: profile.date_of_birth || null,
        gender: profile.gender,
        location: profile.location,
        timezone: profile.timezone,
        language: profile.language,
        preferred_role: profile.preferred_role,
        experience_level: profile.experience_level,
        years_of_experience: profile.years_of_experience || null,
        primary_skills: profile.primary_skills,
        secondary_skills: profile.secondary_skills,
        tech_stack: profile.tech_stack,
        portfolio: profile.portfolio,
        github: profile.github,
        linkedin: profile.linkedin,
        resume: profile.resume,
        current_company: profile.current_company,
        preferred_job_type: profile.preferred_job_type,
        career_goal: profile.career_goal,
        target_exam: profile.target_exam,
        daily_study_hours: profile.daily_study_hours || "2.0",
      });
      setProfile(normalizeProfile(data));
      setFeedback("Profile saved for your account.");
    } catch (err) {
      setFeedback(getApiErrorMessage(err, "Could not save profile changes."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ProfileSkeleton />;

  return (
    <div className="profile-os-page page-content">
      <motion.section className="profile-hero-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="profile-hero-orbit" aria-hidden="true" />
        <div className="profile-avatar-uploader">
          {profile.avatar ? <img src={profile.avatar} alt={`${displayName} avatar`} /> : <span>{getInitials(displayName)}</span>}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadAvatar} aria-label="Choose avatar image" />
          <button type="button" aria-label="Upload avatar" onClick={() => fileInputRef.current?.click()}><Upload size={17} /></button>
        </div>
        <div className="profile-hero-copy">
          <span className="profile-status"><i /> Current user profile</span>
          <h2>{displayName}</h2>
          <p className="profile-role">{profile.preferred_role || "Add preferred role"}</p>
          <p>{profile.bio || "Add a short bio to personalize your career workspace."}</p>
          <div className="profile-hero-meta">
            <span>@{profile.username}</span>
            <span>{profile.email}</span>
            <span>Joined {formatJoinDate(profile.joined_at)}</span>
          </div>
          <div className="profile-hero-actions">
            <button type="button" onClick={startEditingProfile}><Sparkles size={17} /> Edit Profile</button>
            <button type="button" className="secondary" onClick={openPortfolio}><ExternalLink size={17} /> Portfolio</button>
            <button type="button" className="profile-save-button" onClick={saveProfile} disabled={saving}><Save size={17} /> {saving ? "Saving..." : "Save Profile"}</button>
          </div>
          {feedback && <p className="profile-action-feedback" role="status">{feedback}</p>}
        </div>
        <div className="profile-completion">
          <ProfileRing value={completion} label="Profile complete" />
        </div>
      </motion.section>

      <section className="profile-grid profile-grid--two" ref={basicInfoRef}>
        <ProfilePanel title="Basic Information" eyebrow="Identity">
          <ProfileField label="Full Name" name="full_name" value={profile.full_name} onChange={updateProfileField} placeholder="Add your full name" error={errors.full_name} />
          <ProfileField label="Username" value={profile.username} icon={Mail} readOnly />
          <ProfileField label="Email" value={profile.email} icon={Mail} readOnly />
          <ProfileField label="Phone" name="phone" value={profile.phone} onChange={updateProfileField} placeholder="Add phone number" icon={Phone} error={errors.phone} />
          <ProfileField label="Date of Birth" name="date_of_birth" value={profile.date_of_birth || ""} onChange={updateProfileField} type="date" placeholder="Add date of birth" />
          <ProfileField label="Gender" name="gender" value={profile.gender} onChange={updateProfileField} placeholder="Add gender" />
          <ProfileField label="Location" name="location" value={profile.location} onChange={updateProfileField} placeholder="Add location" icon={MapPin} />
          <ProfileField label="Timezone" name="timezone" value={profile.timezone} onChange={updateProfileField} placeholder="Add timezone" />
          <ProfileField label="Language" name="language" value={profile.language} onChange={updateProfileField} placeholder="Add languages" />
        </ProfilePanel>

        <ProfilePanel title="Professional Information" eyebrow="Career DNA">
          <ProfileField label="Preferred Role" name="preferred_role" value={profile.preferred_role} onChange={updateProfileField} placeholder="Add preferred role" />
          <ProfileField label="Experience Level" name="experience_level" value={profile.experience_level} onChange={updateProfileField} placeholder="Add experience level" />
          <ProfileField label="Years of Experience" name="years_of_experience" value={profile.years_of_experience || ""} onChange={updateProfileField} type="number" placeholder="0" />
          <ProfileField label="Primary Skills" name="primary_skills" value={profile.primary_skills} onChange={updateProfileField} placeholder="React, Django, APIs" />
          <ProfileField label="Secondary Skills" name="secondary_skills" value={profile.secondary_skills} onChange={updateProfileField} placeholder="Testing, UI Design" />
          <ProfileField label="Preferred Tech Stack" name="tech_stack" value={profile.tech_stack} onChange={updateProfileField} placeholder="Next.js, PostgreSQL, Tailwind" />
          <ProfileField label="Portfolio URL" name="portfolio" value={profile.portfolio} onChange={updateProfileField} placeholder="https://your-site.com" error={errors.portfolio} />
          <ProfileField label="GitHub URL" name="github" value={profile.github} onChange={updateProfileField} placeholder="https://github.com/username" icon={Github} error={errors.github} />
          <ProfileField label="LinkedIn URL" name="linkedin" value={profile.linkedin} onChange={updateProfileField} placeholder="https://linkedin.com/in/username" icon={Linkedin} error={errors.linkedin} />
          <label className="profile-field">
            <span>Resume Upload</span>
            <input value={profile.resume || ""} onChange={event => updateProfileField("resume", event.target.value)} placeholder="Upload or add resume filename" />
            <input ref={resumeInputRef} className="profile-hidden-file" type="file" accept=".pdf,.doc,.docx" onChange={uploadResume} />
            <button type="button" className="profile-inline-action" onClick={() => resumeInputRef.current?.click()}>Choose file</button>
          </label>
          <ProfileField label="Current Company" name="current_company" value={profile.current_company} onChange={updateProfileField} placeholder="Add current company" />
          <ProfileField label="Preferred Job Type" name="preferred_job_type" value={profile.preferred_job_type} onChange={updateProfileField} placeholder="Remote / Hybrid / On-site" />
        </ProfilePanel>
      </section>

      <section className="profile-ai-panel">
        <div className="profile-panel-heading">
          <span>AI Career Insights</span>
          <h2>Career intelligence cockpit</h2>
        </div>
        <div className="profile-insight-grid">
          <article><small>Career Goal</small><strong>{profile.career_goal || "Add career goal"}</strong><p>{profile.career_goal ? "AI recommendations will adapt to this target." : "Define your next role to unlock roadmap guidance."}</p></article>
          <article><small>Preferred Role</small><strong>{profile.preferred_role || "Add preferred role"}</strong><p>Used for skill gaps, projects, and interview prep.</p></article>
          <article><small>Profile Status</small><strong>{completion}% complete</strong><p>Optional fields stay empty until you choose to fill them.</p></article>
          {profileMetrics.map(([label, value, detail]) => (
            <article className="profile-metric-card" key={label}>
              <ProfileRing value={value} label={label} />
              <p>{detail}</p>
            </article>
          ))}
        </div>
        <div className="profile-chart-row">
          <div className="profile-empty-state">
            <strong>Skill Gap Analysis</strong>
            <p>Add skills, tech stack, and career goal to generate personalized AI insights.</p>
            <button type="button" className="secondary" onClick={startEditingProfile}>Add details</button>
          </div>
          <div className="profile-ai-recommendations">
            <strong>AI Recommendations</strong>
            <p>{completion > 40 ? "Your profile has enough signal for first-pass recommendations." : "Complete your role, skills, and portfolio links to unlock useful recommendations."}</p>
            <div><span>Learning Focus</span><b>{profile.tech_stack || "Add tech stack"}</b></div>
            <div><span>Career Goal</span><b>{profile.career_goal || "Add career goal"}</b></div>
          </div>
        </div>
      </section>

      <section className="profile-grid profile-grid--sidebar">
        <ProfilePanel title="Skills Matrix" eyebrow="Mastery map">
          {skillRows.length ? (
            <div className="profile-skill-list">
              {skillRows.map((skill, index) => (
                <motion.div className="profile-skill-row" key={`${skill}-${index}`} whileHover={{ x: 4 }}>
                  <div><strong>{skill}</strong><span>User provided</span></div>
                  <meter min="0" max="100" value={35 + index * 7} />
                  <b>{35 + index * 7}%</b>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyCard title="No skills added" detail="Add primary skills and tech stack to build your skills matrix." onClick={startEditingProfile} />
          )}
        </ProfilePanel>

        <ProfilePanel title="Activity & Achievements" eyebrow="Momentum">
          <div className="profile-activity-grid">
            {activityCards.map(([title, detail, meta]) => (
              <article key={title}>
                <CheckCircle2 size={18} />
                <strong>{title}</strong>
                <p>{detail}</p>
                <span>{meta}</span>
              </article>
            ))}
          </div>
        </ProfilePanel>
      </section>

      <section className="profile-settings-panel" id="settings">
        <div className="profile-panel-heading">
          <span>Settings</span>
          <h2>Workspace controls</h2>
        </div>
        {["Dark/light theme", "Notifications", "Privacy", "Public profile", "AI personalization", "Connected accounts"].map((item, index) => (
          <label className="profile-toggle-row" key={item}>
            <span>{item}</span>
            <input type="checkbox" defaultChecked={index !== 2} />
          </label>
        ))}
      </section>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="profile-os-page page-content">
      <section className="profile-hero-card profile-skeleton-card">
        <div className="profile-skeleton profile-skeleton-avatar" />
        <div>
          <div className="profile-skeleton profile-skeleton-line short" />
          <div className="profile-skeleton profile-skeleton-title" />
          <div className="profile-skeleton profile-skeleton-line" />
        </div>
      </section>
      <section className="profile-grid profile-grid--two">
        <div className="profile-panel profile-skeleton-block" />
        <div className="profile-panel profile-skeleton-block" />
      </section>
    </div>
  );
}

function EmptyCard({ title, detail, onClick }) {
  return (
    <div className="profile-empty-state">
      <strong>{title}</strong>
      <p>{detail}</p>
      <button type="button" className="secondary" onClick={onClick}>Add details</button>
    </div>
  );
}

function ProfilePanel({ title, eyebrow, children }) {
  return (
    <motion.section className="profile-panel" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}>
      <div className="profile-panel-heading">
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <div className="profile-field-grid">{children}</div>
    </motion.section>
  );
}

function ProfileField({ label, name, value, onChange, icon: Icon, type = "text", placeholder = "Add details", error, readOnly = false }) {
  return (
    <label className={`profile-field ${readOnly ? "is-readonly" : ""}`}>
      <span>{Icon && <Icon size={15} />} {label}</span>
      <input
        type={type}
        value={value || ""}
        onChange={event => onChange?.(name, event.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
      />
      {error && <em>{error}</em>}
    </label>
  );
}

function ProfileRing({ value, label }) {
  return (
    <div className="profile-ring" style={{ "--value": `${value}%` }}>
      <strong>{value}%</strong>
      <span>{label}</span>
    </div>
  );
}
