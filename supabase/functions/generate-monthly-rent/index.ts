import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current month and year
    const now = new Date();
    const currentMonth = now.toLocaleString('en-US', { month: 'long' });
    const currentYear = now.getFullYear();
    
    // Calculate due date (10th of current month)
    const dueDate = new Date(currentYear, now.getMonth(), 10);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    console.log(`Generating rent invoices for ${currentMonth} ${currentYear}`);

    // Get all active tenants with their flat_id and rent_amount
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("id, flat_id, rent_amount, name")
      .not("flat_id", "is", null)
      .or(`end_date.is.null,end_date.gte.${now.toISOString().split('T')[0]}`);

    if (tenantsError) {
      console.error("Error fetching tenants:", tenantsError);
      throw tenantsError;
    }

    console.log(`Found ${tenants?.length || 0} active tenants`);

    if (!tenants || tenants.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active tenants found", invoicesCreated: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check for existing invoices this month to avoid duplicates
    const { data: existingInvoices, error: existingError } = await supabase
      .from("invoices")
      .select("flat_id")
      .eq("month", currentMonth)
      .eq("year", currentYear)
      .eq("invoice_type", "rent");

    if (existingError) {
      console.error("Error checking existing invoices:", existingError);
      throw existingError;
    }

    const existingFlatIds = new Set(existingInvoices?.map(inv => inv.flat_id) || []);
    console.log(`Found ${existingFlatIds.size} existing rent invoices for this month`);

    // Filter out tenants who already have invoices this month
    const tenantsToInvoice = tenants.filter(t => !existingFlatIds.has(t.flat_id));
    console.log(`Creating invoices for ${tenantsToInvoice.length} tenants`);

    if (tenantsToInvoice.length === 0) {
      return new Response(
        JSON.stringify({ message: "All rent invoices already exist for this month", invoicesCreated: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create invoices for each tenant
    const invoicesToCreate = tenantsToInvoice.map(tenant => ({
      flat_id: tenant.flat_id,
      amount: tenant.rent_amount,
      month: currentMonth,
      year: currentYear,
      due_date: dueDateStr,
      invoice_type: "rent",
      status: "unpaid",
      description: `Monthly rent for ${currentMonth} ${currentYear}`
    }));

    const { data: createdInvoices, error: createError } = await supabase
      .from("invoices")
      .insert(invoicesToCreate)
      .select();

    if (createError) {
      console.error("Error creating invoices:", createError);
      throw createError;
    }

    console.log(`Successfully created ${createdInvoices?.length || 0} rent invoices`);

    return new Response(
      JSON.stringify({ 
        message: `Created ${createdInvoices?.length || 0} rent invoices for ${currentMonth} ${currentYear}`,
        invoicesCreated: createdInvoices?.length || 0
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in generate-monthly-rent:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
