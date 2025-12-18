import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeEmailRequest = await req.json();
    
    console.log("Sending welcome email to:", email);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userName = name || "User";

    const emailResponse = await resend.emails.send({
      from: "NASH-MS <support@eduintbd.com>",
      to: [email],
      subject: "Welcome to NASH‑MS – Your Building, One Smart Dashboard",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
            .container { background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #10b981; }
            .logo { font-size: 28px; font-weight: bold; color: #10b981; }
            h1 { color: #1f2937; font-size: 24px; margin-bottom: 20px; }
            h2 { color: #10b981; font-size: 18px; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #10b981; padding-left: 12px; }
            h3 { color: #374151; font-size: 16px; margin-top: 25px; margin-bottom: 10px; }
            p { margin-bottom: 15px; color: #4b5563; }
            .feature-item { background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 12px; }
            .feature-title { font-weight: 600; color: #065f46; margin-bottom: 5px; }
            .stakeholder-section { background: #faf5ff; padding: 15px; border-radius: 8px; margin-bottom: 12px; }
            .stakeholder-title { font-weight: 600; color: #7c3aed; margin-bottom: 5px; }
            .pricing-card { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #10b981; }
            .pricing-name { font-weight: 600; color: #1f2937; }
            .contact-box { background: #ecfdf5; padding: 20px; border-radius: 8px; margin-top: 25px; text-align: center; }
            .contact-item { margin: 8px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
            .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 15px 0; }
            .highlight { color: #10b981; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">NASH‑MS</div>
              <p style="margin: 0; color: #6b7280;">Building Management System</p>
            </div>
            
            <h1>Dear ${userName},</h1>
            
            <p>Welcome to <span class="highlight">NASH‑MS</span>, a modern, web-based Building Management System built in Bangladesh for Bangladeshi properties. From today, your residential building can move away from notebooks, Excel files and scattered WhatsApp groups into one centralized, transparent platform for owners, tenants, managers and committee members.</p>
            
            <p>Think of NASH‑MS as your <strong>live building control panel</strong> – with occupancy, payments, expenses, staff and service requests visible in a single, clean dashboard, accessible from anywhere.</p>
            
            <h2>What you can do with NASH‑MS</h2>
            
            <div class="feature-item">
              <div class="feature-title">📊 See everything at a glance</div>
              <p style="margin: 0;">Get a real-time dashboard of your building: flats, occupancy, dues, collections, expenses and today's key activities (paid invoices, new service requests, ongoing maintenance).</p>
            </div>
            
            <div class="feature-item">
              <div class="feature-title">🏠 Manage flats, owners and tenants in one place</div>
              <p style="margin: 0;">Maintain a full directory of flats, flat owners and tenants with occupancy tracking so you always know who lives where and who is responsible for which payments.</p>
            </div>
            
            <div class="feature-item">
              <div class="feature-title">💰 Professional invoicing and expense tracking</div>
              <p style="margin: 0;">Generate maintenance bills, track payments, and record every expense for full financial transparency – perfect for AGMs, audits and avoiding disputes.</p>
            </div>
            
            <div class="feature-item">
              <div class="feature-title">📝 Handle complaints without WhatsApp chaos</div>
              <p style="margin: 0;">Residents can log complaints and service requests directly into the system, while you track status and updates without losing anything inside long chat threads.</p>
            </div>
            
            <div class="feature-item">
              <div class="feature-title">👥 Keep staff and CCTV organized</div>
              <p style="margin: 0;">Store staff records and manage CCTV information in a secure, structured way so your building's operations and security stay documented and accessible.</p>
            </div>
            
            <div class="feature-item">
              <div class="feature-title">🤖 AI assistant and smart notifications</div>
              <p style="margin: 0;">Use the built‑in AI assistant for quick summaries (like last month's maintenance collection and dues) and send automated payment reminders via email and WhatsApp.</p>
            </div>
            
            <h2>Built for every stakeholder</h2>
            
            <div class="stakeholder-section">
              <div class="stakeholder-title">🏢 Flat owners</div>
              <p style="margin: 0;">Get clear visibility of maintenance costs, full payment history and transparent records that reduce confusion and conflict.</p>
            </div>
            
            <div class="stakeholder-section">
              <div class="stakeholder-title">🔑 Tenants</div>
              <p style="margin: 0;">Receive bills easily, can pay using shared links, and submit complaints or requests in a traceable, structured way.</p>
            </div>
            
            <div class="stakeholder-section">
              <div class="stakeholder-title">📋 Committees & managers</div>
              <p style="margin: 0;">Enjoy centralized control of all building data, automated reminders, and easy reporting for meetings and audits.</p>
            </div>
            
            <h2>Simple, scalable pricing</h2>
            
            <p>Whether you manage a small building or a large community, NASH‑MS offers flexible per‑flat pricing and optional onboarding support.</p>
            
            <div class="pricing-card">
              <div class="pricing-name">Starter</div>
              <p style="margin: 5px 0 0 0;">For small buildings (up to 20 flats) with dashboard, resident directory, invoicing and email notifications.</p>
            </div>
            
            <div class="pricing-card">
              <div class="pricing-name">Standard</div>
              <p style="margin: 5px 0 0 0;">For medium buildings (21–60 flats) with all Starter features plus service request tracking, WhatsApp notifications and expense management.</p>
            </div>
            
            <div class="pricing-card">
              <div class="pricing-name">Enterprise</div>
              <p style="margin: 5px 0 0 0;">For 60+ flats with AI assistant, camera integration, dedicated support and custom reports.</p>
            </div>
            
            <p><em>Annual billing discounts and one-time onboarding / implementation support are also available.</em></p>
            
            <h2>Backed by EDUINTBD</h2>
            
            <p>NASH‑MS is developed by <strong>EDUINTBD</strong>, a trusted study abroad partner helping Bangladeshi students secure admissions and scholarships in top universities across the UK, USA, Canada, Australia and Europe. With the same focus on transparency, structured processes and long‑term relationships, EDUINTBD brings that service mindset into building management in Bangladesh through NASH‑MS.</p>
            
            <h2>Next steps</h2>
            
            <p>✅ Log in to your NASH‑MS account and explore your dashboard.</p>
            <p>✅ Add your building details, flats, owners/tenants and current dues to get a complete picture from day one.</p>
            <p>✅ If you'd like a guided walkthrough, you can book a free demo or talk to the team.</p>
            
            <div class="contact-box">
              <div class="contact-item">📍 264 Elephant Road, Dhaka</div>
              <div class="contact-item">📞 +880 1898‑934‑855</div>
              <div class="contact-item">🌐 nash.eduintbd.ai</div>
            </div>
            
            <p style="text-align: center; margin-top: 25px;"><strong>Welcome once again to NASH‑MS. Your building just got smarter, more transparent and easier to manage.</strong></p>
            
            <div class="footer">
              <p>© 2024 NASH‑MS by EDUINTBD. All rights reserved.</p>
              <p>264 Elephant Road, Dhaka, Bangladesh</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    if (emailResponse.error) {
      console.error("Error sending welcome email:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: "Failed to send welcome email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
