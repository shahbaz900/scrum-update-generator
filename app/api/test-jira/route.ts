import { NextRequest, NextResponse } from "next/server";
import { fetchJiraIssues } from "@/lib/jira";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  console.log("🔵 Test Jira endpoint called");
  
  try {
    let body;
    try {
      body = await request.json();
      console.log("✅ JSON parsed successfully");
    } catch (e) {
      console.error("❌ Failed to parse JSON:", e);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { jiraUrl, jiraEmail, jiraToken } = body;
    console.log("📧 Credentials received:", { 
      jiraUrl, 
      jiraEmail, 
      jiraToken: jiraToken ? "***" : "MISSING" 
    });

    if (!jiraUrl || !jiraEmail || !jiraToken) {
      console.error("❌ Missing required credentials");
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 }
      );
    }

    console.log("🔄 Attempting to fetch Jira issues...");
    const issues = await fetchJiraIssues(jiraUrl, jiraEmail, jiraToken);
    console.log(`✅ Jira connection successful. Found ${issues.length} issues.`);

    return NextResponse.json({
      success: true,
      message: "Connection successful!",
      issueCount: issues.length,
    });
  } catch (error) {
    console.error("❌ Error in test-jira:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("📋 Full error:", errorMessage);
    
    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
