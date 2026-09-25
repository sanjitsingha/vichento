import { supabase } from "@/lib/supabaseClient";

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.description) {
      return Response.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from("bug_reports")
      .insert([
        {
          title: body.title,
          description: body.description,
          // These columns are NOT NULL in BUG_REPORTS_SETUP.sql but optional in the form.
          steps_to_reproduce: body.steps || "",
          expected_behavior: body.expected_behavior || "",
          actual_behavior: body.actual_behavior || "",
          severity: body.severity || "medium",
          page_url: body.page_url || null,
          attachments: body.attachments || null,
          reporter_id: body.reporter_id || null,
          reporter_email: body.reporter_email || null,
          status: body.status || "open",
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return Response.json(
        { message: "Failed to create bug report", error: error.message },
        { status: 500 },
      );
    }

    return Response.json(
      { message: "Bug report submitted successfully", data },
      { status: 201 },
    );
  } catch (error) {
    console.error("API error:", error);
    return Response.json(
      { message: "Internal server error", error: error.message },
      { status: 500 },
    );
  }
}
