import { NextRequest, NextResponse } from "next/server";
import { fetchJiraIssues } from "@/lib/jira";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jiraUrl, jiraEmail, jiraToken } = body;

    if (!jiraUrl || !jiraEmail || !jiraToken) {
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 },
      );
    }

    // Test the connection by fetching issues
    const issues = await fetchJiraIssues(jiraUrl, jiraEmail, jiraToken);
    console.log(`Connection successful. Found ${issues.length} issues.`);

    return NextResponse.json({
      success: true,
      message: "Connection successful!",
      issueCount: issues.length,
    });
  } catch (error) {
    console.error("Error testing Jira connection:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to test connection",
      },
      { status: 500 },
    );
  }
}
