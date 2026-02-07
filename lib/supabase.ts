import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export interface SavedScrum {
  id?: string;
  userEmail: string;
  createdAt: string;
  jiraIssuesInput: string; // JSON string of issues sent to Claude
  claudeOutput: string; // Claude's response
  timezone: string;
  publicHolidays: string[];
}

export async function saveScrum(data: SavedScrum) {
  if (!supabase) {
    console.warn("Supabase not configured. Scrum update not saved.");
    return null;
  }

  try {
    const { data: result, error } = await supabase
      .from("scrum_updates")
      .insert([data])
      .select();

    if (error) {
      console.error("Error saving to Supabase:", error);
      return null;
    }

    return result?.[0];
  } catch (err) {
    console.error("Error saving scrum update:", err);
    return null;
  }
}

export async function getScrumHistory(userEmail: string, limit: number = 10) {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("scrum_updates")
      .select("*")
      .eq("userEmail", userEmail)
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching history:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error fetching scrum history:", err);
    return [];
  }
}
