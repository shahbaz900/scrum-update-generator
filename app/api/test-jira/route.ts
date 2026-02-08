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
    console.log(`✓ Jira connection successful. Found ${issues.length} issues.`);

    return NextResponse.json({
      success: true,
      message: "Connection successful!",
      issueCount: issues.length,
    });
  } catch (error) {
    console.error("Error testing Jira connection:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to test connection";
    console.error("Error details:", errorMessage);
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
