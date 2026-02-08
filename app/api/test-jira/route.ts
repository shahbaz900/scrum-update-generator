import { NextRequest, NextResponse } from "next/server";
import { fetchJiraIssues } from "@/lib/jira";

export async function POST(request: NextRequest) {
  try {
    console.log("Test Jira endpoint called");
    
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { jiraUrl, jiraEmail, jiraToken } = body;
    console.log("Credentials received:", { jiraUrl, jiraEmail, jiraToken: jiraToken ? "***" : "missing" });

    if (!jiraUrl || !jiraEmail || !jiraToken) {
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 },
      );
    }

    // Test the connection by fetching issues
    console.log("Attempting to fetch Jira issues...");
    const issues = await fetchJiraIssues(jiraUrl, jiraEmail, jiraToken);
    console.log(`✓ Jira connection successful. Found ${issues.length} issues.`);

    return NextResponse.json({
      success: true,
      message: "Connection successful!",
      issueCount: issues.length,
    });
  } catch (error) {
    console.error("Error testing Jira connection:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 },
    );
  }
}
