import { Fragment, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Bot,
  Brain,
  CalendarDays,
  Clock3,
  Minimize2,
  RefreshCcw,
  Send,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import { api } from "../services/api";

const welcomeMessage = {
  role: "assistant",
  text: "Hi there.\nI'm your AI Study Assistant.\nHow can I help you today?",
};

const suggestions = [
  { label: "Create a Study Plan", icon: CalendarDays, prompt: "Create a study plan for my upcoming exam." },
  { label: "Recommend Topics", icon: BookOpen, prompt: "Recommend the most important topics I should study next." },
  { label: "Time Management Tips", icon: Clock3, prompt: "Give me time management tips for studying better today." },
  { label: "Quiz Me", icon: Brain, prompt: "Quiz me on a difficult topic." },
  { label: "Generate Revision Schedule", icon: Sparkles, prompt: "Generate a revision schedule for this week." },
  { label: "Explain Difficult Topic", icon: WandSparkles, prompt: "Explain a difficult topic in simple terms." },
];

function AssistantMarkdown({ text }) {
  const lines = String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  return (
    <div className="ai-assistant-markdown">
      {lines.map((line, index) => {
        const heading = line.replace(/^#{1,6}\s*/, "").replace(/^\*\*(.+)\*\*:?$/, "$1");

        if (/^#{1,6}\s+/.test(line)) return <h3 key={index}>{renderInlineMarkdown(heading)}</h3>;
        if (/^\*\*.+\*\*:?$/.test(line)) return <h4 key={index}>{renderInlineMarkdown(heading)}</h4>;
        if (/^\d+\.\s+/.test(line)) {
          return <p key={index} className="ai-assistant-step">{renderInlineMarkdown(line.replace(/^\d+\.\s+/, ""))}</p>;
        }
        if (/^[-*]\s+/.test(line)) {
          return <p key={index} className="ai-assistant-bullet">{renderInlineMarkdown(line.replace(/^[-*]\s+/, ""))}</p>;
        }

        return <p key={index}>{renderInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

function renderInlineMarkdown(text) {
  return String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      className={`ai-assistant-message ${isUser ? "is-user" : "is-bot"}`}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {!isUser && (
        <span className="ai-assistant-avatar" aria-hidden="true">
          <Bot size={15} />
        </span>
      )}
      <div className="ai-assistant-bubble">
        {isUser ? message.text : <AssistantMarkdown text={message.text} />}
      </div>
    </motion.div>
  );
}

function SuggestionCard({ suggestion, onSelect }) {
  const Icon = suggestion.icon;

  return (
    <motion.button
      type="button"
      className="ai-assistant-suggestion"
      whileHover={{ y: -1, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(suggestion.prompt)}
    >
      <Icon size={16} />
      <span>{suggestion.label}</span>
    </motion.button>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      className="ai-assistant-message is-bot"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
    >
      <span className="ai-assistant-avatar" aria-hidden="true">
        <Bot size={15} />
      </span>
      <div className="ai-assistant-bubble ai-assistant-typing">
        <span>Thinking</span>
        <i />
        <i />
        <i />
      </div>
    </motion.div>
  );
}

export default function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  function resetChat() {
    setMessages([welcomeMessage]);
    setInput("");
    setIsTyping(false);
  }

  async function sendMessage(text) {
    const prompt = text.trim();
    if (!prompt || isTyping) return;

    setMessages(current => [...current, { role: "user", text: prompt }]);
    setInput("");
    setIsTyping(true);

    try {
      const { data } = await api.post("/chatbot/", {
        message: prompt,
        mode: "quick",
        depth: "concise",
      });
      setMessages(current => [
        ...current,
        { role: "assistant", text: data?.reply || "I'm ready to help. Tell me what you're studying." },
      ]);
    } catch {
      setMessages(current => [
        ...current,
        {
          role: "assistant",
          text: "I can't reach the study assistant service right now. Try again in a moment, or ask me to help outline a plan here.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="ai-assistant-widget" aria-live="polite">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            className="ai-assistant-panel"
            initial={{ opacity: 0, y: 28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 120 }}
            dragElastic={0.08}
            onDragEnd={(_, info) => {
              if (window.matchMedia("(max-width: 920px)").matches && info.offset.y > 80) {
                setIsOpen(false);
              }
            }}
            aria-label="AI Study Assistant chat"
          >
            <header className="ai-assistant-header">
              <div className="ai-assistant-title">
                <span>
                  <Sparkles size={17} />
                </span>
                <strong>AI Study Assistant</strong>
              </div>
              <div className="ai-assistant-header-actions">
                <button type="button" onClick={resetChat} aria-label="Refresh chat" title="Refresh chat">
                  <RefreshCcw size={17} />
                </button>
                <button type="button" onClick={() => setIsOpen(false)} aria-label="Minimize chat" title="Minimize">
                  <Minimize2 size={17} />
                </button>
                <button type="button" onClick={() => setIsOpen(false)} aria-label="Close chat" title="Close">
                  <X size={18} />
                </button>
              </div>
            </header>

            <div className="ai-assistant-body" ref={logRef}>
              <div className="ai-assistant-messages">
                {messages.map((message, index) => (
                  <MessageBubble message={message} key={`${message.role}-${index}-${message.text.slice(0, 12)}`} />
                ))}
                <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
              </div>

              {messages.length === 1 && (
                <div className="ai-assistant-suggestions" aria-label="Quick actions">
                  {suggestions.map(suggestion => (
                    <SuggestionCard suggestion={suggestion} onSelect={sendMessage} key={suggestion.label} />
                  ))}
                </div>
              )}
            </div>

            <form className="ai-assistant-inputbar" onSubmit={handleSubmit}>
              <input
                value={input}
                onChange={event => setInput(event.target.value)}
                placeholder="Ask anything..."
                aria-label="Ask anything"
              />
              <motion.button
                type="submit"
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <Send size={18} />
              </motion.button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        className="ai-assistant-launcher"
        aria-label="AI Study Assistant"
        title="AI Study Assistant"
        initial={{ opacity: 0, y: 18, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 360, damping: 24 }}
        onClick={() => setIsOpen(value => !value)}
      >
        <span className="ai-assistant-launcher-tooltip">AI Study Assistant</span>
        <Bot size={30} strokeWidth={2.25} />
      </motion.button>
    </div>
  );
}
