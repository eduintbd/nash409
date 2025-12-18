import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TenantAgreementRequest {
  tenantId: string;
  tenantEmail: string;
  tenantName: string;
  flatNumber: string;
  ownerName: string;
  rentAmount: number;
  securityDeposit: number;
  houseRules: string;
  maintenanceResponsibilities: string;
  startDate: string;
  endDate: string | null;
  agreementToken: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-tenant-agreement function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: TenantAgreementRequest = await req.json();
    console.log("Received tenant agreement request for:", data.tenantEmail);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the app URL from the request origin or use a default
    const origin = req.headers.get("origin") || "https://mouycggqqbievsjwsdgc.lovableproject.com";
    const agreementLink = `${origin}/tenant-agreement/${data.agreementToken}`;
    const signupLink = `${origin}/auth`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; color: #1f2937; margin-bottom: 10px; border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .label { font-weight: 500; color: #6b7280; }
          .value { color: #1f2937; }
          .rules-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 10px 0; }
          .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 10px 5px; }
          .btn-secondary { background: #10b981; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 Tenant Agreement / ভাড়াটিয়া চুক্তি</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${data.tenantName}</strong>,</p>
            <p>You have been added as a tenant for Flat <strong>${data.flatNumber}</strong>. Please review the agreement details below and confirm your acceptance.</p>
            
            <div class="section">
              <div class="section-title">📋 Agreement Details / চুক্তির বিবরণ</div>
              <div class="detail-row"><span class="label">Flat Number / ফ্ল্যাট নম্বর:</span><span class="value">${data.flatNumber}</span></div>
              <div class="detail-row"><span class="label">Owner / মালিক:</span><span class="value">${data.ownerName}</span></div>
              <div class="detail-row"><span class="label">Monthly Rent / মাসিক ভাড়া:</span><span class="value">৳${data.rentAmount.toLocaleString()}</span></div>
              <div class="detail-row"><span class="label">Security Deposit / জামানত:</span><span class="value">৳${data.securityDeposit.toLocaleString()}</span></div>
              <div class="detail-row"><span class="label">Start Date / শুরুর তারিখ:</span><span class="value">${data.startDate}</span></div>
              ${data.endDate ? `<div class="detail-row"><span class="label">End Date / শেষ তারিখ:</span><span class="value">${data.endDate}</span></div>` : ''}
            </div>
            
            ${data.houseRules ? `
            <div class="section">
              <div class="section-title">📜 House Rules / বাড়ির নিয়ম</div>
              <div class="rules-box">${data.houseRules.replace(/\n/g, '<br>')}</div>
            </div>
            ` : ''}
            
            ${data.maintenanceResponsibilities ? `
            <div class="section">
              <div class="section-title">🔧 Maintenance Responsibilities / রক্ষণাবেক্ষণ দায়িত্ব</div>
              <div class="rules-box">${data.maintenanceResponsibilities.replace(/\n/g, '<br>')}</div>
            </div>
            ` : ''}
            
            <div class="section" style="text-align: center; padding-top: 20px;">
              <p><strong>To accept this agreement:</strong></p>
              <a href="${agreementLink}" class="btn">✅ View & Accept Agreement</a>
              <p style="margin-top: 20px;">New to the portal? Sign up first:</p>
              <a href="${signupLink}" class="btn btn-secondary">📝 Sign Up to Portal</a>
            </div>
          </div>
          <div class="footer">
            <p>This email was sent from the Building Management System.<br/>
            If you have any questions, please contact the building management.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NASH-MS <support@eduintbd.cloud>",
        to: [data.tenantEmail],
        subject: `Tenant Agreement for Flat ${data.flatNumber} / ফ্ল্যাট ${data.flatNumber} এর ভাড়াটিয়া চুক্তি`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email sent:", emailResult);

    if (!emailResponse.ok) {
      throw new Error(emailResult.message || "Failed to send email");
    }

    // Update tenant record with invitation sent timestamp
    const { error: updateError } = await supabase
      .from('tenants')
      .update({ 
        invitation_sent_at: new Date().toISOString(),
        agreement_status: 'sent'
      })
      .eq('id', data.tenantId);

    if (updateError) {
      console.error("Error updating tenant:", updateError);
    }

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-tenant-agreement function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
