/**
 * Scrum Update Generator Frontend
 * 
 * ⚙️ Copilot CLI Was Used In Development:
 * - Used to debug state management issues with streaming responses
 * - Helped optimize React hooks and performance
 * - Assisted with understanding html2pdf integration
 * - Provided guidance on error handling patterns
 */

"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { saveScrum } from "@/lib/supabase";

// @ts-ignore - html2pdf.js typing issue
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

function copyToClipboard(text: string, onCopy: (msg: string) => void) {
  navigator.clipboard.writeText(text).then(() => {
    onCopy("✅ Copied to clipboard!");
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
  const [tooltipMessage, setTooltipMessage] = useState<string | null>(null);

  // Auto-dismiss tooltip after 5 seconds
  useEffect(() => {
    if (tooltipMessage) {
      const timer = setTimeout(() => {
        setTooltipMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [tooltipMessage]);

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

  // Save public holidays immediately when changed
  useEffect(() => {
    if (setupForm.publicHolidays.length > 0 || setupForm.jiraUrl) {
      const updatedCreds = {
        ...setupForm,
      };
      localStorage.setItem("scrumUpdateCreds", JSON.stringify(updatedCreds));
      if (setupForm.jiraUrl && setupForm.jiraEmail && setupForm.jiraToken) {
        setCredentials(updatedCreds);
      }
    }
  }, [setupForm.publicHolidays]);

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
      let hasReceivedContent = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        
        // Stop showing "Generating..." as soon as first chunk arrives
        if (!hasReceivedContent) {
          hasReceivedContent = true;
          setLoading(false);
        }
        
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

  // Check if a section has been fully received by checking if its marker and next marker exist
  const isSectionLocked = (text: string, currentMarker: string, nextMarker: string | null): boolean => {
    const hasCurrentMarker = text.includes(`[${currentMarker}]`);
    if (!hasCurrentMarker) return false;
    
    // If there's a next marker, we need both markers to confirm section is received
    if (nextMarker) {
      return text.includes(`[${nextMarker}]`);
    }
    
    // For the last section (BLOCKERS), check if all three markers are present
    // This indicates streaming is complete
    return text.includes(`[YESTERDAY]`) && text.includes(`[TODAY]`) && text.includes(`[BLOCKERS]`);
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
        <div className="setup-container">
          <div className="setup-sidebar">
            <div className="sidebar-content">
              <h2>Connect Your Jira Workspace</h2>
              <p>
                Securely integrate your Jira account to generate automated daily
                scrum updates using AI.
              </p>
              
              <div className="features-list">
                <div className="feature-item">
                  <span className="feature-icon">•</span>
                  <span>Enterprise-grade security</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">•</span>
                  <span>Encrypted credential storage</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">•</span>
                  <span>GDPR compliant</span>
                </div>
              </div>

              <div className="sidebar-help">
                <p>Need help?</p>
                <a 
                  href="/docs"
                  className="help-link"
                >
                  View documentation →
                </a>
              </div>
            </div>
          </div>

          <div className="setup-form-container">
            <div className="form-header">
              <h1>Scrum Update Generator</h1>
              <p>Setup Jira Integration</p>
              <p className="form-subtitle">
                Connect your Jira account and generate lightning-fast scrum updates with AI
              </p>
            </div>

            <div className="setup-form">
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
                    className="token-link"
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
                <p className="help-text">
                  Select dates that are public holidays. These will be skipped
                  when showing work updates.
                </p>
                <input
                  type="date"
                  id="holidayInput"
                  className="date-input"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (e.target.value) {
                      addHoliday(e.target.value);
                      e.target.value = "";
                    }
                  }}
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
                  <div className="holidays-tags">
                    {setupForm.publicHolidays.map((holiday) => (
                      <div key={holiday} className="holiday-tag">
                        {holiday}
                        <button
                          type="button"
                          onClick={() => removeHoliday(holiday)}
                          className="tag-remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && <div className="error">{error}</div>}

              <button
                className={`button button-primary ${testing ? "loading" : ""}`}
                onClick={testConnection}
                disabled={
                  testing ||
                  !setupForm.jiraUrl ||
                  !setupForm.jiraEmail ||
                  !setupForm.jiraToken
                }
              >
                {testing ? "Testing..." : "Test & Connect"}
              </button>
            </div>
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
          <div className="header-left">
            <div className="app-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="6" fill="#2563EB"/>
                <path d="M7 8H17" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M7 12H17" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M7 16H12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h1>Scrum Update Generator</h1>
          </div>
          
          <div className="header-right">
            <div className="user-info">
              <div className="user-email">{credentials.jiraEmail}</div>
              <button className="change-account-link" onClick={logout}>Change Account</button>
            </div>
            <div className="user-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
        </div>

        <div className="toolbar-container">
          <div className="left-actions">
            <button
              className={`button ${loading ? "loading" : ""}`}
              onClick={generateScrumUpdate}
              disabled={loading}
            >
              <span className="icon">📄</span>
              {loading ? "Generating..." : "Generate Scrum Update"}
            </button>
          </div>

          {output && (
            <div className="right-actions">
              <button
                className="button-action"
                onClick={() => downloadPDF(output)}
                title="Download as PDF"
              >
                <span style={{ marginRight: '6px' }}>📄</span> PDF
              </button>

              <button
                className="button-action"
                onClick={() => copyToClipboard(extractPlainText(output), setTooltipMessage)}
                title="Copy to clipboard"
              >
                <span style={{ marginRight: '6px' }}>📋</span> Copy
              </button>

              <button
                className="button-action"
                onClick={() => shareOnTeams(extractPlainText(output))}
                title="Share on Microsoft Teams"
              >
                <span style={{ marginRight: '6px' }}>👥</span> Teams
              </button>

              <button
                className="button-action"
                onClick={() => shareViaEmail(extractPlainText(output))}
                title="Share via Email"
              >
                <span style={{ marginRight: '6px' }}>📧</span> Email
              </button>
            </div>
          )}
        </div>

        <div className="main-output">
          {error && <div className="error">❌ Error: {error}</div>}

          {output && (
            <div className="output" id="scrum-output-pdf">
              {(() => {
                const sections = parseOutputSections(output);
                const todayDate = new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                });
                
                return (
                  <div className="section">
                    <div className="daily-update-header">
                      <h2>Daily Update <span className="date-separator">—</span> <span className="date-text">{todayDate}</span></h2>
                    </div>

                    <div className="output-section">
                      <div className="output-section-title">
                        Yesterday — {sections.yesterdayDate ? formatDateWithDay(sections.yesterdayDate) : "Date N/A"}
                      </div>
                      <ul>
                        {sections.yesterday && sections.yesterday.trim() ? (
                          renderSection(sections.yesterday)
                        ) : isSectionLocked(output, 'YESTERDAY', 'TODAY') ? (
                          <li>No activities recorded</li>
                        ) : (
                          <li style={{color: '#9ca3af', fontStyle: 'italic'}}>⏳ Generating...</li>
                        )}
                      </ul>
                    </div>

                    <div className="output-section">
                      <div className="output-section-title">
                        Today — {sections.todayDate ? formatDateWithDay(sections.todayDate) : "Date N/A"}
                      </div>
                      <ul>
                        {sections.today && sections.today.trim() ? (
                          renderSection(sections.today)
                        ) : sections.isWeekend && isSectionLocked(output, 'TODAY', 'BLOCKERS') ? (
                          <li>It's the weekend</li>
                        ) : isSectionLocked(output, 'TODAY', 'BLOCKERS') ? (
                          <li>No activities recorded</li>
                        ) : (
                          <li style={{color: '#9ca3af', fontStyle: 'italic'}}>⏳ Generating...</li>
                        )}
                      </ul>
                    </div>

                    <div className="output-section">
                      <div className="output-section-title">
                        Blockers
                      </div>
                      <ul>
                        {sections.blockers && sections.blockers.trim() ? (
                          renderSection(sections.blockers)
                        ) : isSectionLocked(output, 'BLOCKERS', null) ? (
                          <li>None</li>
                        ) : (
                          <li style={{color: '#9ca3af', fontStyle: 'italic'}}>⏳ Generating...</li>
                        )}
                      </ul>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {loading && !output && (
            <div className="loading">
              🔄 Fetching Jira data and generating with Claude...
            </div>
          )}
        </div>
      </div>

      {tooltipMessage && (
        <div className="tooltip-notification">
          {tooltipMessage}
        </div>
      )}
    </main>
  );
}
