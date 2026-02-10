"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { saveScrum } from "@/lib/supabase";

const html2pdf = dynamic(() => import("html2pdf.js"), { ssr: false });

interface Credentials {
  jiraUrl: string;
  jiraEmail: string;
  jiraToken: string;
  publicHolidays?: string[]; // Array of YYYY-MM-DD dates
}

function getUserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getTimezoneOffset() {
  const now = new Date();
  return -now.getTimezoneOffset(); // in minutes
}

function formatDateWithDay(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${dayName}, ${formatted}`;
}

async function downloadPDF(output: string) {
  const element = document.getElementById("scrum-output-pdf");
  if (!element) return;

  // Dynamically import html2pdf to avoid SSR issues
  const html2pdf = (await import("html2pdf.js")).default;

  const opt = {
    margin: 10,
    filename: `scrum-update-${new Date().toISOString().split("T")[0]}.pdf`,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: {
      orientation: "portrait" as const,
      unit: "mm" as const,
      format: "a4" as const,
    },
  };

  html2pdf().set(opt).from(element).save();
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Copied to clipboard!");
  });
}

function shareOnWhatsApp(text: string) {
  const encodedText = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encodedText}`, "_blank");
}

function shareOnTeams(text: string) {
  const encodedText = encodeURIComponent(text);
  window.open(
    `https://teams.microsoft.com/share?text=${encodedText}`,
    "_blank",
  );
}

function shareViaEmail(text: string) {
  const subject = `Scrum Update - ${new Date().toLocaleDateString()}`;
  const body = encodeURIComponent(text);
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
}

function extractPlainText(output: string): string {
  // Remove metadata and convert to plain text
  return output
    .replace(/\[META\][\s\S]*?\[|META\]/g, "")
    .replace(/\[(YESTERDAY|TODAY|BLOCKERS)\]/g, "\n$1\n")
    .replace(/•/g, "-")
    .trim();
}

export default function Home() {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [setupForm, setSetupForm] = useState({
    jiraUrl: "",
    jiraEmail: "",
    jiraToken: "",
    publicHolidays: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [showSetup, setShowSetup] = useState(false);
  const [jiraIssuesInput, setJiraIssuesInput] = useState(""); // Store input for saving
  const [generationTime, setGenerationTime] = useState<Date | null>(null); // Store when generated
  const [isSaving, setIsSaving] = useState(false);

  // Load credentials from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("scrumUpdateCreds");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCredentials(parsed);
      } catch {
        localStorage.removeItem("scrumUpdateCreds");
      }
    } else {
      setShowSetup(true);
    }
  }, []);

  // Update current date/time every second
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setCurrentDateTime(formatted);
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSetupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSetupForm((prev) => ({ ...prev, [name]: value }));
  };

  const addHoliday = (dateStr: string) => {
    if (dateStr && !setupForm.publicHolidays.includes(dateStr)) {
      setSetupForm((prev) => ({
        ...prev,
        publicHolidays: [...prev.publicHolidays, dateStr].sort(),
      }));
    }
  };

  const removeHoliday = (dateStr: string) => {
    setSetupForm((prev) => ({
      ...prev,
      publicHolidays: prev.publicHolidays.filter((d) => d !== dateStr),
    }));
  };

  const testConnection = async () => {
    setTesting(true);
    setError("");

    try {
      const response = await fetch("/api/test-jira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setupForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Connection failed");
      }

      // Save to localStorage
      localStorage.setItem("scrumUpdateCreds", JSON.stringify(setupForm));
      setCredentials(setupForm);
      setShowSetup(false);
      setSetupForm({
        jiraUrl: "",
        jiraEmail: "",
        jiraToken: "",
        publicHolidays: [],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to test connection",
      );
    } finally {
      setTesting(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("scrumUpdateCreds");
    setCredentials(null);
    setShowSetup(true);
    setOutput("");
  };

  const generateScrumUpdate = async () => {
    if (!credentials) return;

    setLoading(true);
    setError("");
    setOutput("");
    setJiraIssuesInput("");
    setGenerationTime(new Date());

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...credentials,
          timezone: getUserTimezone(),
          timezoneOffsetMinutes: getTimezoneOffset(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate scrum update");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        setOutput(result);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScrum = async () => {
    if (!output || !credentials) return;

    setIsSaving(true);
    try {
      const plainText = extractPlainText(output);
      const result = await saveScrum({
        userEmail: credentials.jiraEmail,
        createdAt: new Date().toISOString(),
        jiraIssuesInput: jiraIssuesInput || output, // Store the input or output
        claudeOutput: plainText,
        timezone: getUserTimezone(),
        publicHolidays: credentials.publicHolidays || [],
      });

      if (result) {
        alert("✅ Scrum update saved successfully!");
      } else {
        alert("⚠️ Scrum update saved locally (Supabase not configured)");
      }
    } catch (err) {
      console.error("Error saving scrum update:", err);
      alert("❌ Failed to save scrum update");
    } finally {
      setIsSaving(false);
    }
  };

  const parseOutputSections = (text: string) => {
    const metaMatch = text.match(/\[META\]([\s\S]*?)\[\|META\]/);
    const yesterdayMatch = text.match(/\[YESTERDAY\]([\s\S]*?)(?=\[TODAY\]|$)/);
    const todayMatch = text.match(/\[TODAY\]([\s\S]*?)(?=\[BLOCKERS\]|$)/);
    const blockersMatch = text.match(/\[BLOCKERS\]([\s\S]*?)$/);

    let meta: {
      yesterdayDate?: string;
      todayDate?: string;
      isWeekend?: boolean;
    } = {};
    if (metaMatch) {
      try {
        meta = JSON.parse(metaMatch[1].trim());
      } catch {}
    }

    return {
      yesterdayDate: meta.yesterdayDate,
      todayDate: meta.todayDate,
      isWeekend: meta.isWeekend,
      yesterday: yesterdayMatch ? yesterdayMatch[1].trim() : "",
      today: todayMatch ? todayMatch[1].trim() : "",
      blockers: blockersMatch ? blockersMatch[1].trim() : "",
    };
  };

  const renderSection = (content: string) => {
    return content
      .split("\n")
      .filter((line) => line.trim())
      .map((line, idx) => (
        <li key={idx}>{line.replace(/^•\s*/, "").trim()}</li>
      ));
  };

  // Setup View
  if (showSetup || !credentials) {
    return (
      <main>
        <div className="container">
          <h1>⚡ Scrum Update Generator</h1>
          <p>
            Connect your Jira account and generate lightning-fast scrum updates
            with AI
          </p>

          <div className="setup-form">
            <h2>Setup Your Jira Connection</h2>

            <div className="form-group">
              <label>Jira Organization URL</label>
              <input
                type="text"
                name="jiraUrl"
                placeholder="https://your-company.atlassian.net"
                value={setupForm.jiraUrl}
                onChange={handleSetupChange}
              />
            </div>

            <div className="form-group">
              <label>Jira Email</label>
              <input
                type="email"
                name="jiraEmail"
                placeholder="your-email@company.com"
                value={setupForm.jiraEmail}
                onChange={handleSetupChange}
              />
            </div>

            <div className="form-group">
              <label>
                Jira API Token{" "}
                <a
                  href="https://id.atlassian.com/manage-profile/security/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "0.85rem", color: "#667eea" }}
                >
                  (Get Token)
                </a>
              </label>
              <input
                type="password"
                name="jiraToken"
                placeholder="Your API Token"
                value={setupForm.jiraToken}
                onChange={handleSetupChange}
              />
            </div>

            <div className="form-group">
              <label>Public Holidays (Optional)</label>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#718096",
                  margin: "0.5rem 0 1rem 0",
                }}
              >
                Select dates that are public holidays. These will be skipped
                when showing work updates.
              </p>
              <input
                type="date"
                id="holidayInput"
                style={{ marginBottom: "0.8rem" }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") {
                    addHoliday((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  if (e.target.value) {
                    addHoliday(e.target.value);
                    e.target.value = "";
                  }
                }}
              />
              {setupForm.publicHolidays.length > 0 && (
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                >
                  {setupForm.publicHolidays.map((holiday) => (
                    <div
                      key={holiday}
                      style={{
                        background: "#edf2f7",
                        padding: "0.5rem 0.8rem",
                        borderRadius: "4px",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      {holiday}
                      <button
                        type="button"
                        onClick={() => removeHoliday(holiday)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#718096",
                          cursor: "pointer",
                          fontSize: "1rem",
                          padding: "0",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <div className="error">❌ {error}</div>}

            <button
              className={`button ${testing ? "loading" : ""}`}
              onClick={testConnection}
              disabled={
                testing ||
                !setupForm.jiraUrl ||
                !setupForm.jiraEmail ||
                !setupForm.jiraToken
              }
            >
              {testing ? "🔄 Testing..." : "✅ Test & Connect"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Main View
  return (
    <main>
      <div className="container">
        <div className="header">
          <div>
            <h1>⚡ Scrum Update Generator</h1>
            <div className="header-info">
              Connected as {credentials.jiraEmail} | {currentDateTime}
            </div>
          </div>
          <button className="button-small" onClick={logout}>
            🔄 Change Account
          </button>
        </div>

        <button
          className={`button ${loading ? "loading" : ""}`}
          onClick={generateScrumUpdate}
          disabled={loading}
        >
          {loading ? "⏳ Generating..." : "🚀 Generate Scrum Update"}
        </button>

        {error && <div className="error">❌ Error: {error}</div>}

        {output && (
          <div className="output" id="scrum-output-pdf">
            {(() => {
              const sections = parseOutputSections(output);
              return (
                <div className="section">
                  <div className="output-section">
                    <div className="output-section-title">
                      ✅ Yesterday
                      {sections.yesterdayDate &&
                        ` - ${formatDateWithDay(sections.yesterdayDate)}`}
                    </div>
                    <ul>
                      {sections.yesterday && sections.yesterday.trim() ? (
                        renderSection(sections.yesterday)
                      ) : (
                        <li>No activities recorded</li>
                      )}
                    </ul>
                  </div>

                  <div className="output-section">
                    <div className="output-section-title">
                      ✅ Today{sections.isWeekend ? " (Weekend)" : ""}
                      {sections.todayDate &&
                        ` - ${formatDateWithDay(sections.todayDate)}`}
                    </div>
                    <ul>
                      {sections.today && sections.today.trim() ? (
                        renderSection(sections.today)
                      ) : sections.isWeekend ? (
                        <li>It's the weekend</li>
                      ) : (
                        <li>No activities recorded</li>
                      )}
                    </ul>
                  </div>

                  <div className="output-section">
                    <div className="output-section-title">
                      🚧 Blockers & Impediments
                    </div>
                    <ul>
                      {sections.blockers && sections.blockers.trim() ? (
                        renderSection(sections.blockers)
                      ) : (
                        <li>No blockers identified</li>
                      )}
                    </ul>
                  </div>

                  {output && (
                    <p className="output-note">
                      Note: This is an automatically generated, it appears very
                      minimal.
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: "0.8rem",
                flexWrap: "wrap",
                marginTop: "2rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <button
                className="button-action"
                onClick={() => downloadPDF(output)}
                title="Download as PDF"
              >
                📥 PDF
              </button>

              <button
                className="button-action"
                onClick={() => copyToClipboard(extractPlainText(output))}
                title="Copy to clipboard"
              >
                📋 Copy
              </button>

              <button
                className="button-action"
                onClick={() => shareOnWhatsApp(extractPlainText(output))}
                title="Share on WhatsApp"
              >
                💬 WhatsApp
              </button>

              <button
                className="button-action"
                onClick={() => shareOnTeams(extractPlainText(output))}
                title="Share on Microsoft Teams"
              >
                👥 Teams
              </button>

              <button
                className="button-action"
                onClick={() => shareViaEmail(extractPlainText(output))}
                title="Share via Email"
              >
                📧 Email
              </button>

              <button
                className={`button-action ${isSaving ? "loading" : ""}`}
                onClick={handleSaveScrum}
                disabled={isSaving}
                title="Save to Supabase"
              >
                {isSaving ? "💾 Saving..." : "💾 Save"}
              </button>
            </div>
          </div>
        )}

        {loading && !output && (
          <div className="loading">
            🔄 Fetching Jira data and generating with Claude...
          </div>
        )}
      </div>
    </main>
  );
}
