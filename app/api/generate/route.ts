/**
 * Scrum Update Generator API Route
 * 
 * ⚙️ Copilot CLI Was Used In Development:
 * - Used `gh copilot explain` to debug streaming response errors
 * - Used `gh copilot suggest` to optimize NextResponse handling
 * - Helped understand Jira API error handling patterns
 * - Assisted with TypeScript typing for ReadableStream
 * 
 * This endpoint:
 * 1. Accepts Jira credentials from the client
 * 2. Fetches recent issues from Jira API
 * 3. Categorizes them by date (yesterday/today)
 * 4. Streams a Claude-generated scrum update in real-time
 */

import { NextRequest, NextResponse } from "next/server";
import { Anthropic } from "@anthropic-ai/sdk";
import { fetchJiraIssues, categorizeIssues, formatIssueForContext } from "@/lib/jira";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jiraUrl, jiraEmail, jiraToken, publicHolidays = [], timezone = "UTC", timezoneOffsetMinutes = 0 } = body;

    if (!jiraUrl || !jiraEmail || !jiraToken) {
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 }
      );
    }

    // Get Claude key from env
    const claudeKey = process.env.CLAUDE_API_KEY;
    if (!claudeKey) {
      return NextResponse.json(
        { error: "Claude API key not configured" },
        { status: 500 }
      );
    }

    // Fetch Jira issues with provided credentials
    const issues = await fetchJiraIssues(jiraUrl, jiraEmail, jiraToken);
    console.log(`📊 Fetched ${issues.length} issues from Jira`);
    console.log(`🕐 Timezone offset: ${timezoneOffsetMinutes} minutes`);
    
    const categorized = categorizeIssues(issues, publicHolidays, timezoneOffsetMinutes);
    console.log(`📅 Categorized: Yesterday=${categorized.yesterday.length}, Today=${categorized.today.length}, Blockers=${categorized.blockers.length}`);

    // Format issues for Claude with rich context (comments, worklogs, changelog)
    const issuesText = `
Yesterday's Work (${categorized.yesterdayDate}):
${
  categorized.yesterday.length > 0
    ? categorized.yesterday.map((issue) => formatIssueForContext(issue)).join("\n\n")
    : "No issues"
}

Today's Work (${categorized.todayDate}${categorized.isWeekend ? " - Weekend" : ""}):
${
  categorized.today.length > 0
    ? categorized.today.map((issue) => formatIssueForContext(issue)).join("\n\n")
    : "No issues"
}

Blockers & Impediments:
${
  categorized.blockers
    .map((issue) => `- [${issue.key}] ${issue.fields.summary}`)
    .join("\n") || "No blockers"
}
`;

    // Create metadata to send back to client
    const metadata = {
      yesterdayDate: categorized.yesterdayDate,
      todayDate: categorized.todayDate,
      isWeekend: categorized.isWeekend,
    };

    // Create Claude client with provided key
    const client = new Anthropic({
      apiKey: claudeKey,
    });

    // Stream response from Claude Haiku
    const stream = client.messages.stream({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `Generate a professional scrum standup update from this Jira data.

CRITICAL RULES:
1. Output ONLY the three sections with these markers: [YESTERDAY] [TODAY] [BLOCKERS]
2. Output NO intro text, NO notes, NO extra explanations
3. For each section, list only bullet points (starting with •)
4. Each bullet point should be 1-2 lines max
5. If a section has no items, leave it empty (no text after marker)
6. Use actual work details from comments, status changes, and time logged - don't just list titles

Format example:
[YESTERDAY]
• Completed authentication flow
• Reviewed PR comments and updated solution

[TODAY]
• Working on API integration
• Debugging database connection issue

[BLOCKERS]
• Waiting on design approval for UI mockups

Here is the issue data:

${issuesText}`,
        },
      ],
    });

    // Create a readable stream
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send metadata first
          controller.enqueue(new TextEncoder().encode(`[META]${JSON.stringify(metadata)}[|META]\n`));
          
          // Then stream Claude response
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(new TextEncoder().encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error generating scrum update:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate scrum update",
      },
      { status: 500 }
    );
  }
}
