import axios from "axios";

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
    assignee: {
      displayName: string;
    } | null;
    created: string;
    updated: string;
    issuetype: {
      name: string;
    };
    description?: string;
    labels?: string[];
    comment?: {
      comments: Array<{
        body: string;
        author?: { displayName: string };
        created: string;
      }>;
    };
    worklog?: {
      worklogs: Array<{
        timeSpent: string;
        author?: { displayName: string };
        started: string;
      }>;
    };
  };
  changelog?: {
    histories: Array<{
      created: string;
      items: Array<{
        field: string;
        fromString?: string;
        toString?: string;
      }>;
    }>;
  };
}

export async function fetchJiraIssues(
  jiraUrl?: string,
  jiraEmail?: string,
  jiraToken?: string,
  publicHolidays?: string[],
): Promise<JiraIssue[]> {
  // Use provided credentials or fall back to env vars
  const url = jiraUrl || process.env.JIRA_URL;
  const email = jiraEmail || process.env.JIRA_EMAIL;
  const token = jiraToken || process.env.JIRA_API_TOKEN;

  if (!url || !email || !token) {
    throw new Error("Missing Jira configuration");
  }

  try {
    // Get past 7 days to find working days
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
    const todayStr = today.toISOString().split("T")[0];

    // JQL query to get recent issues
    const jql = `assignee = currentUser() AND (updated >= ${sevenDaysAgoStr} OR created >= ${sevenDaysAgoStr}) ORDER BY updated DESC`;

    // Remove trailing slash if present
    const baseUrl = url.endsWith("/") ? url.slice(0, -1) : url;

    const response = await axios.post(
      `${baseUrl}/rest/api/3/search/jql`,
      {
        jql,
        maxResults: 100,
        fields: [
          "summary",
          "status",
          "assignee",
          "created",
          "updated",
          "issuetype",
          "description",
          "labels",
          "comment",
          "worklog",
          "changelog",
        ],
      },
      {
        auth: {
          username: email,
          password: token,
        },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );

    return response.data.issues || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const messages = error.response?.data?.errorMessages || [];
      const message = messages.length > 0 ? messages[0] : `HTTP ${status}`;
      console.error(`Jira API Error (${status}):`, message);
      throw new Error(`Jira API Error: ${message}`);
    }
    console.error("Jira API Error:", error);
    throw new Error("Failed to fetch Jira issues");
  }
}

export function formatIssueForContext(issue: JiraIssue): string {
  const parts: string[] = [];

  // Issue header
  parts.push(`[${issue.key}] ${issue.fields.summary}`);
  parts.push(`Status: ${issue.fields.status.name}`);

  // Comments (latest)
  if (
    issue.fields.comment?.comments &&
    issue.fields.comment.comments.length > 0
  ) {
    const latestComments = issue.fields.comment.comments.slice(-2); // Last 2 comments
    parts.push("\nLatest Comments:");
    latestComments.forEach((comment) => {
      parts.push(`- "${comment.body}"`);
    });
  }

  // Worklogs
  if (
    issue.fields.worklog?.worklogs &&
    issue.fields.worklog.worklogs.length > 0
  ) {
    const totalTime = issue.fields.worklog.worklogs.reduce((sum, log) => {
      // Parse time format like "2h 30m" or "1d"
      const match = log.timeSpent.match(/(\d+)([hdm])/g) || [];
      let minutes = 0;
      match.forEach((m) => {
        const val = parseInt(m);
        if (m.includes("h")) minutes += val * 60;
        else if (m.includes("d"))
          minutes += val * 480; // 8 hours per day
        else if (m.includes("m")) minutes += val;
      });
      return sum + minutes;
    }, 0);

    const hours = Math.floor(totalTime / 60);
    const mins = totalTime % 60;
    parts.push(`\nTime Spent: ${hours}h ${mins}m`);
  }

  // Changelog (status changes)
  if (issue.changelog?.histories) {
    const statusChanges = issue.changelog.histories
      .filter((h) => h.items?.some((i) => i.field === "status"))
      .slice(-2); // Last 2 changes

    if (statusChanges.length > 0) {
      parts.push("\nRecent Changes:");
      statusChanges.forEach((change) => {
        const statusItem = change.items.find((i) => i.field === "status");
        if (statusItem) {
          parts.push(
            `- Status changed from "${statusItem.fromString}" to "${statusItem.toString}"`,
          );
        }
      });
    }
  }

  return parts.join("\n");
}

export function categorizeIssues(
  issues: JiraIssue[],
  publicHolidays?: string[],
  timezoneOffsetMinutes: number = 0,
): {
  yesterday: JiraIssue[];
  today: JiraIssue[];
  blockers: JiraIssue[];
  yesterdayDate: string;
  todayDate: string;
  isWeekend: boolean;
} {
  const holidays = new Set(publicHolidays || []);

  // Get current date in user's timezone
  const now = new Date();
  now.setMinutes(now.getMinutes() + timezoneOffsetMinutes);

  const getTodayStr = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayStr(now);
  const todayDayOfWeek = now.getUTCDay();
  const isWeekend = todayDayOfWeek === 0 || todayDayOfWeek === 6; // Sunday or Saturday

  // Group issues by date (in user's timezone)
  const issuesByDate: { [key: string]: JiraIssue[] } = {};
  issues.forEach((issue) => {
    const date = new Date(issue.fields.updated);
    date.setMinutes(date.getMinutes() + timezoneOffsetMinutes);
    const dateStr = getTodayStr(date);
    if (!issuesByDate[dateStr]) {
      issuesByDate[dateStr] = [];
    }
    issuesByDate[dateStr].push(issue);
  });

  // Find working days: prioritize weekdays, skip weekends
  const workingDays: string[] = [];

  for (let i = 1; i < 14; i++) {
    // Start from 1 day back (not today)
    const checkDate = new Date(now);
    checkDate.setUTCDate(checkDate.getUTCDate() - i);
    const dateStr = getTodayStr(checkDate);
    const dayOfWeek = checkDate.getUTCDay();
    const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;

    // Skip if it's a public holiday
    if (holidays.has(dateStr)) continue;

    // Skip weekends entirely (we'll add them back if no weekdays exist)
    if (isWeekendDay) continue;

    // Weekday found
    workingDays.push(dateStr);
    if (workingDays.length >= 2) break;
  }

  // If we don't have enough weekday data, add recent weekend activity last
  if (workingDays.length < 2) {
    for (let i = 1; i < 14; i++) {
      const checkDate = new Date(now);
      checkDate.setUTCDate(checkDate.getUTCDate() - i);
      const dateStr = getTodayStr(checkDate);
      const dayOfWeek = checkDate.getUTCDay();
      const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;

      // Skip if it's a public holiday or already in working days
      if (holidays.has(dateStr) || workingDays.includes(dateStr)) continue;

      // Add weekend only if it has activity
      if (isWeekendDay && issuesByDate[dateStr]) {
        workingDays.push(dateStr);
        if (workingDays.length >= 2) break;
      }
    }
  }

  // Assign dates:
  // today = always the current date (even if weekend)
  // yesterday = the most recent working day (not today)
  const yesterdayDate = workingDays[0] || ""; // Most recent working day
  const todayDate = todayStr; // Always current date

  const blockers = issues.filter((issue) => {
    const labels = issue.fields.labels || [];
    return (
      labels.some(
        (label) =>
          label.toLowerCase().includes("blocker") ||
          label.toLowerCase().includes("impediment"),
      ) || issue.fields.status.name === "Blocked"
    );
  });

  return {
    yesterday: issuesByDate[yesterdayDate] || [],
    today: issuesByDate[todayDate] || [],
    blockers,
    yesterdayDate,
    todayDate,
    isWeekend,
  };
}
