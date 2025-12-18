import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, userRole, flatIds, ownerId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current date for context
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });
    const currentYear = currentDate.getFullYear();

    // Fetch data based on user role
    let contextData: any = {
      currentDate: currentDate.toISOString(),
      currentMonth,
      currentYear,
      role: userRole,
    };

    if (userRole === 'admin') {
      // Fetch all data for admin
      const [invoicesRes, expensesRes, flatsRes, tenantsRes, serviceRequestsRes] = await Promise.all([
        supabase.from('invoices').select('*, flats(flat_number)'),
        supabase.from('expenses').select('*, expense_categories(name)'),
        supabase.from('flats').select('*'),
        supabase.from('tenants').select('*, flats(flat_number)'),
        supabase.from('service_requests').select('*, flats(flat_number)'),
      ]);

      const invoices = invoicesRes.data || [];
      const expenses = expensesRes.data || [];
      const flats = flatsRes.data || [];
      const tenants = tenantsRes.data || [];
      const serviceRequests = serviceRequestsRes.data || [];

      // Calculate financial summaries
      const totalIncome = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const pendingPayments = invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue');
      const totalPending = pendingPayments.reduce((sum, i) => sum + Number(i.amount), 0);
      const overdueInvoices = invoices.filter(i => i.status === 'overdue');

      contextData = {
        ...contextData,
        summary: {
          totalIncome,
          totalExpenses,
          netBalance: totalIncome - totalExpenses,
          totalPending,
          overdueCount: overdueInvoices.length,
          overdueAmount: overdueInvoices.reduce((sum, i) => sum + Number(i.amount), 0),
        },
        flats: {
          total: flats.length,
          occupied: flats.filter(f => f.status === 'tenant').length,
          ownerOccupied: flats.filter(f => f.status === 'owner-occupied').length,
          vacant: flats.filter(f => f.status === 'vacant').length,
        },
        pendingPayments: pendingPayments.map(p => ({
          flatNumber: p.flats?.flat_number,
          amount: p.amount,
          month: p.month,
          year: p.year,
          status: p.status,
          dueDate: p.due_date,
        })),
        serviceRequests: {
          open: serviceRequests.filter(r => r.status === 'open').length,
          inProgress: serviceRequests.filter(r => r.status === 'in-progress').length,
          resolved: serviceRequests.filter(r => r.status === 'resolved').length,
          openRequests: serviceRequests.filter(r => r.status === 'open' || r.status === 'in-progress').map(r => ({
            title: r.title,
            flatNumber: r.flats?.flat_number,
            priority: r.priority,
            status: r.status,
            category: r.category,
          })),
        },
        recentExpenses: expenses.slice(0, 10).map(e => ({
          description: e.description,
          amount: e.amount,
          category: e.expense_categories?.name,
          date: e.date,
        })),
        tenants: tenants.map(t => ({
          name: t.name,
          flatNumber: t.flats?.flat_number,
          rentAmount: t.rent_amount,
          phone: t.phone,
        })),
      };
    } else if (userRole === 'owner') {
      // Fetch owner-specific data - handle case where ownerId might be missing
      if (!ownerId) {
        contextData = {
          ...contextData,
          dataStatus: {
            hasProperties: false,
            hasTenants: false,
            hasInvoices: false,
            message: "No owner profile found. You may need to contact the admin to link your account to your properties."
          },
          properties: [],
          financials: { totalReceived: 0, totalPending: 0, pendingInvoices: [] },
          tenants: [],
          serviceRequests: [],
        };
      } else {
        const [ownerFlatsRes, ownerInfoRes] = await Promise.all([
          supabase.from('owner_flats').select('flat_id, flats(*)').eq('owner_id', ownerId),
          supabase.from('owners').select('*').eq('id', ownerId).single(),
        ]);

        const ownerFlats = ownerFlatsRes.data || [];
        const ownerInfo = ownerInfoRes.data;
        const ownerFlatIds = ownerFlats.map((of: any) => of.flat_id);

        // Only fetch if there are flats
        let invoices: any[] = [];
        let serviceRequests: any[] = [];
        let tenants: any[] = [];

        if (ownerFlatIds.length > 0) {
          const [invoicesRes, serviceRequestsRes, tenantsRes] = await Promise.all([
            supabase.from('invoices').select('*, flats(flat_number)').in('flat_id', ownerFlatIds),
            supabase.from('service_requests').select('*, flats(flat_number)').in('flat_id', ownerFlatIds),
            supabase.from('tenants').select('*, flats(flat_number)').in('flat_id', ownerFlatIds),
          ]);
          invoices = invoicesRes.data || [];
          serviceRequests = serviceRequestsRes.data || [];
          tenants = tenantsRes.data || [];
        }

        const receivedAmount = invoices.filter((i: any) => i.status === 'paid').reduce((sum: number, i: any) => sum + Number(i.amount), 0);
        const pendingInvoices = invoices.filter((i: any) => i.status === 'unpaid' || i.status === 'overdue');
        const pendingAmount = pendingInvoices.reduce((sum: number, i: any) => sum + Number(i.amount), 0);

        // Build intelligent data status
        const dataStatus = {
          hasProperties: ownerFlats.length > 0,
          propertyCount: ownerFlats.length,
          hasTenants: tenants.length > 0,
          tenantCount: tenants.length,
          hasInvoices: invoices.length > 0,
          hasPendingPayments: pendingInvoices.length > 0,
          hasOpenServiceRequests: serviceRequests.filter((r: any) => r.status === 'open' || r.status === 'in-progress').length > 0,
        };

        contextData = {
          ...contextData,
          ownerInfo: ownerInfo ? {
            name: ownerInfo.name,
            phone: ownerInfo.phone,
            email: ownerInfo.email,
            ownershipStart: ownerInfo.ownership_start,
          } : null,
          dataStatus,
          properties: ownerFlats.map((of: any) => ({
            flatNumber: (of.flats as any)?.flat_number,
            floor: (of.flats as any)?.floor,
            size: (of.flats as any)?.size,
            status: (of.flats as any)?.status,
            hasTenant: tenants.some((t: any) => t.flat_id === of.flat_id),
          })),
          financials: {
            totalReceived: receivedAmount,
            totalPending: pendingAmount,
            pendingInvoices: pendingInvoices.map((i: any) => ({
              flatNumber: i.flats?.flat_number,
              amount: i.amount,
              month: i.month,
              year: i.year,
              dueDate: i.due_date,
              status: i.status,
            })),
          },
          tenants: tenants.map((t: any) => ({
            name: t.name,
            flatNumber: t.flats?.flat_number,
            rentAmount: t.rent_amount,
            startDate: t.start_date,
            endDate: t.end_date,
            phone: t.phone,
            email: t.email,
            agreementStatus: t.agreement_status,
          })),
          serviceRequests: serviceRequests.map((r: any) => ({
            title: r.title,
            flatNumber: r.flats?.flat_number,
            priority: r.priority,
            status: r.status,
            category: r.category,
            createdAt: r.created_at,
          })),
        };
      }
    } else if (userRole === 'tenant') {
      // Fetch tenant-specific data - handle case where tenant might not have flatIds
      const tenantRes = await supabase.from('tenants').select('*, flats(*)').eq('user_id', userId).single();
      const tenant = tenantRes.data;

      if (!tenant || !tenant.flat_id) {
        contextData = {
          ...contextData,
          dataStatus: {
            hasTenantProfile: !!tenant,
            hasFlat: false,
            message: tenant 
              ? "Your tenant profile exists but is not linked to any flat yet. Please contact your landlord or admin."
              : "No tenant profile found. You may need to contact the admin to set up your account."
          },
          tenant: tenant ? {
            name: tenant.name,
            phone: tenant.phone,
            email: tenant.email,
          } : null,
          financials: { totalPaid: 0, totalPending: 0, pendingInvoices: [] },
          serviceRequests: [],
        };
      } else {
        const [invoicesRes, serviceRequestsRes] = await Promise.all([
          supabase.from('invoices').select('*, flats(flat_number)').eq('flat_id', tenant.flat_id),
          supabase.from('service_requests').select('*, flats(flat_number)').eq('flat_id', tenant.flat_id),
        ]);

        const invoices = invoicesRes.data || [];
        const serviceRequests = serviceRequestsRes.data || [];

        const paidAmount = invoices.filter((i: any) => i.status === 'paid').reduce((sum: number, i: any) => sum + Number(i.amount), 0);
        const pendingInvoices = invoices.filter((i: any) => i.status === 'unpaid' || i.status === 'overdue');
        const pendingAmount = pendingInvoices.reduce((sum: number, i: any) => sum + Number(i.amount), 0);
        const overdueInvoices = pendingInvoices.filter((i: any) => i.status === 'overdue');

        // Find next due date
        const upcomingInvoices = pendingInvoices.sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        const nextDue = upcomingInvoices.length > 0 ? upcomingInvoices[0] : null;

        const dataStatus = {
          hasTenantProfile: true,
          hasFlat: true,
          flatNumber: (tenant.flats as any)?.flat_number,
          hasInvoices: invoices.length > 0,
          hasPendingDues: pendingInvoices.length > 0,
          hasOverdueDues: overdueInvoices.length > 0,
          overdueCount: overdueInvoices.length,
          hasServiceRequests: serviceRequests.length > 0,
          openServiceRequests: serviceRequests.filter((r: any) => r.status === 'open' || r.status === 'in-progress').length,
        };

        contextData = {
          ...contextData,
          dataStatus,
          tenant: {
            name: tenant.name,
            phone: tenant.phone,
            email: tenant.email,
            flatNumber: (tenant.flats as any)?.flat_number,
            floor: (tenant.flats as any)?.floor,
            rentAmount: tenant.rent_amount,
            securityDeposit: tenant.security_deposit,
            startDate: tenant.start_date,
            endDate: tenant.end_date,
            agreementStatus: tenant.agreement_status,
          },
          financials: {
            totalPaid: paidAmount,
            totalPending: pendingAmount,
            overdueAmount: overdueInvoices.reduce((sum: number, i: any) => sum + Number(i.amount), 0),
            nextDueDate: nextDue?.due_date,
            nextDueAmount: nextDue?.amount,
            pendingInvoices: pendingInvoices.map((i: any) => ({
              type: i.invoice_type,
              amount: i.amount,
              month: i.month,
              year: i.year,
              dueDate: i.due_date,
              status: i.status,
              description: i.description,
            })),
            paidInvoices: invoices.filter((i: any) => i.status === 'paid').slice(0, 5).map((i: any) => ({
              type: i.invoice_type,
              amount: i.amount,
              month: i.month,
              year: i.year,
              paidDate: i.paid_date,
            })),
          },
          serviceRequests: serviceRequests.map((r: any) => ({
            ticketNumber: r.ticket_number,
            title: r.title,
            status: r.status,
            priority: r.priority,
            category: r.category,
            createdAt: r.created_at,
            resolvedAt: r.resolved_at,
          })),
        };
      }
    }

    // Build intelligent system prompt
    const systemPrompt = `You are a smart, friendly Building Management Assistant for a property management system in Bangladesh.
You have FULL ACCESS to the user's portal data and must provide intelligent, personalized responses.

CRITICAL RULES:
1. Always use BDT (৳) as the currency symbol, format as ৳X,XXX
2. Current date and time in Bangladesh: ${currentDate.toLocaleString('en-BD', { timeZone: 'Asia/Dhaka', dateStyle: 'full', timeStyle: 'short' })}
3. Be SMART - analyze the data intelligently:
   - If arrays are empty, tell them clearly (e.g., "You have no properties listed right now")
   - If data is missing, explain what they need to do
   - Proactively highlight important things (overdue payments, open requests)
4. Be PRECISE with numbers - use exact figures from the data
5. Be HELPFUL - suggest actions they can take
6. User role: ${userRole}

INTELLIGENCE GUIDELINES:
- Check "dataStatus" to understand what data exists
- If hasProperties is false for owner: "You don't have any properties registered in the system yet."
- If hasPendingDues is true for tenant: Highlight the amount and due date
- If hasOverdueDues is true: URGENT - mention this prominently
- Provide context: "Your rent is ৳X per month" or "You own X properties"
- For empty data, don't say "I don't have data" - say "You don't have any X yet"

USER'S COMPLETE PORTAL DATA:
${JSON.stringify(contextData, null, 2)}

Answer questions accurately using the data above. Be conversational, helpful, and smart about interpreting the data.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Assistant error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
