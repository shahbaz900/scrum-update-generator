"use client";

import { useRouter } from "next/navigation";

export default function DocsPage() {
  const router = useRouter();

  const faqs = [
    {
      q: "How do I get started?",
      a: "Simply provide your Jira organization URL, email, and API token. We'll help you generate professional scrum updates in seconds.",
    },
    {
      q: "Is my data secure?",
      a: "Your Jira credentials are encrypted and stored only in your browser. We never store your API token on our servers.",
    },
    {
      q: "Can I export my scrum updates?",
      a: "Yes! You can download updates as PDF, copy to clipboard, or share via WhatsApp and Teams directly from the app.",
    },
    {
      q: "What happens to my saved updates?",
      a: "Your saved updates are stored securely with encryption. You can view, export, or delete them at any time.",
    },
    {
      q: "How do public holidays work?",
      a: "You can mark specific dates as public holidays during setup. These dates will be skipped when categorizing your work.",
    },
    {
      q: "Do I need to update my credentials?",
      a: "No, your credentials are saved securely in your browser. You can change your account anytime from the app.",
    },
  ];

  return (
    <main>
      <div className="docs-container">
        {/* Header */}
        <div className="docs-header">
          <button className="back-button" onClick={() => router.back()}>
            ← Back
          </button>
          <h1>How It Works</h1>
          <p>Everything you need to know about using Scrum Update Generator</p>
        </div>

        {/* Getting Started */}
        <section className="docs-section">
          <h2>Getting Started</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Connect Your Jira</h3>
              <p>Provide your Jira organization URL, email, and API token</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Generate Update</h3>
              <p>Click to generate your scrum update in seconds</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>View & Share</h3>
              <p>Download as PDF, share via email, Teams, or WhatsApp</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Save History</h3>
              <p>Your updates are saved for future reference</p>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="docs-section">
          <h2>Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Lightning Fast</h3>
              <p>Generate professional scrum updates in seconds</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Your Data, Your Control</h3>
              <p>Complete privacy and security for your information</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Smart Organization</h3>
              <p>Automatically categorizes work by date and priorities</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Easy Sharing</h3>
              <p>Export as PDF or share via email, Teams, WhatsApp</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="docs-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <details key={idx} className="faq-item">
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Security & Privacy */}
        <section className="docs-section security-section">
          <h2>Security & Privacy</h2>
          <div className="security-grid">
            <div className="security-item">
              <h3>Local First</h3>
              <p>Your Jira credentials are encrypted and stored only in your browser's local storage</p>
            </div>
            <div className="security-item">
              <h3>Never Logged</h3>
              <p>API tokens are never logged, stored on servers, or shared with third parties</p>
            </div>
            <div className="security-item">
              <h3>Encrypted Transit</h3>
              <p>All data in transit uses industry-standard HTTPS encryption</p>
            </div>
            <div className="security-item">
              <h3>Session-Based</h3>
              <p>Each session is isolated. Data is processed only when you request it</p>
            </div>
          </div>
        </section>

        {/* Technology */}
        <section className="docs-section tech-section">
          <h2>Technology We Use</h2>
          <p className="section-subtitle">
            We partner with industry-leading services to provide you with reliability, security, and performance:
          </p>
          
          <div className="services-list">
            <div className="service-card">
              <div className="service-header">
                <span className="service-icon"></span>
                <h3>Atlassian Jira</h3>
              </div>
              <p className="service-description">Your issue tracking and project management data.</p>
              <a 
                href="https://www.atlassian.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="policy-link compact"
              >
                Privacy Policy
              </a>
            </div>

            <div className="service-card">
              <div className="service-header">
                <span className="service-icon"></span>
                <h3>Advanced AI</h3>
              </div>
              <p className="service-description">Powers intelligent scrum update generation with real-time streaming.</p>
              <a 
                href="https://www.anthropic.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="policy-link compact"
              >
                Privacy Policy
              </a>
            </div>

            <div className="service-card">
              <div className="service-header">
                <span className="service-icon"></span>
                <h3>Secure Database</h3>
              </div>
              <p className="service-description">Securely stores your scrum update history with encryption.</p>
              <a 
                href="https://supabase.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="policy-link compact"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="docs-footer">
          <button className="get-started-btn" onClick={() => router.push("/")}>
            Get Started
          </button>
        </div>
      </div>
    </main>
  );
}

