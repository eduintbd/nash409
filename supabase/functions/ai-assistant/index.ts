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
    } else if (userRole === 'owner' && ownerId) {
      // Fetch owner-specific data
      const [ownerFlatsRes, invoicesRes, serviceRequestsRes, tenantsRes] = await Promise.all([
        supabase.from('owner_flats').select('flat_id, flats(*)').eq('owner_id', ownerId),
        supabase.from('invoices').select('*, flats(flat_number)').in('flat_id', flatIds || []),
        supabase.from('service_requests').select('*, flats(flat_number)').in('flat_id', flatIds || []),
        supabase.from('tenants').select('*, flats(flat_number)').in('flat_id', flatIds || []),
      ]);

      const ownerFlats = ownerFlatsRes.data || [];
      const invoices = invoicesRes.data || [];
      const serviceRequests = serviceRequestsRes.data || [];
      const tenants = tenantsRes.data || [];

      const receivedAmount = invoices.filter((i: any) => i.status === 'paid').reduce((sum: number, i: any) => sum + Number(i.amount), 0);
      const pendingAmount = invoices.filter((i: any) => i.status === 'unpaid' || i.status === 'overdue').reduce((sum: number, i: any) => sum + Number(i.amount), 0);

      contextData = {
        ...contextData,
        properties: ownerFlats.map((of: any) => ({
          flatNumber: (of.flats as any)?.flat_number,
          floor: (of.flats as any)?.floor,
          size: (of.flats as any)?.size,
          status: (of.flats as any)?.status,
        })),
        financials: {
          totalReceived: receivedAmount,
          totalPending: pendingAmount,
          pendingInvoices: invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').map(i => ({
            flatNumber: i.flats?.flat_number,
            amount: i.amount,
            month: i.month,
            year: i.year,
            dueDate: i.due_date,
            status: i.status,
          })),
        },
        tenants: tenants.map(t => ({
          name: t.name,
          flatNumber: t.flats?.flat_number,
          rentAmount: t.rent_amount,
          startDate: t.start_date,
          phone: t.phone,
          agreementStatus: t.agreement_status,
        })),
        serviceRequests: serviceRequests.filter(r => r.status !== 'closed').map(r => ({
          title: r.title,
          flatNumber: r.flats?.flat_number,
          priority: r.priority,
          status: r.status,
        })),
      };
    } else if (userRole === 'tenant' && flatIds?.length > 0) {
      // Fetch tenant-specific data
      const [invoicesRes, serviceRequestsRes, tenantRes] = await Promise.all([
        supabase.from('invoices').select('*, flats(flat_number)').in('flat_id', flatIds),
        supabase.from('service_requests').select('*, flats(flat_number)').in('flat_id', flatIds),
        supabase.from('tenants').select('*').eq('user_id', userId).single(),
      ]);

      const invoices = invoicesRes.data || [];
      const serviceRequests = serviceRequestsRes.data || [];
      const tenant = tenantRes.data;

      const paidAmount = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0);
      const pendingInvoices = invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue');
      const pendingAmount = pendingInvoices.reduce((sum, i) => sum + Number(i.amount), 0);

      contextData = {
        ...contextData,
        tenant: tenant ? {
          name: tenant.name,
          rentAmount: tenant.rent_amount,
          securityDeposit: tenant.security_deposit,
          startDate: tenant.start_date,
          endDate: tenant.end_date,
        } : null,
        financials: {
          totalPaid: paidAmount,
          totalPending: pendingAmount,
          pendingInvoices: pendingInvoices.map(i => ({
            type: i.invoice_type,
            amount: i.amount,
            month: i.month,
            year: i.year,
            dueDate: i.due_date,
            status: i.status,
          })),
        },
        serviceRequests: serviceRequests.map(r => ({
          title: r.title,
          status: r.status,
          priority: r.priority,
          createdAt: r.created_at,
        })),
      };
    }

    // Build system prompt with context
    const systemPrompt = `You are a helpful Building Management Assistant for a property management system in Bangladesh. 
You have access to the user's portal data and should provide precise, accurate answers.

IMPORTANT RULES:
- Always use BDT (৳) as the currency symbol
- Current date and time: ${currentDate.toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })}
- Be precise with numbers and amounts
- Format currency as ৳X,XXX
- Keep responses concise but informative
- If data is not available, say so clearly
- User role: ${userRole}

USER'S PORTAL DATA:
${JSON.stringify(contextData, null, 2)}

Based on this data, answer the user's questions accurately. If they ask about dues, payments, or financial information, use the exact figures from the data above.`;

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
