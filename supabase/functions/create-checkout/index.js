"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_ts_1 = require("https://deno.land/std@0.168.0/http/server.ts");
const npm_stripe_13_2_0_1 = __importDefault(require("npm:stripe@13.2.0"));
const npm_postmark_1 = require("npm:postmark");
const stripe = new npm_stripe_13_2_0_1.default(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
});
const postmark = new npm_postmark_1.ServerClient(Deno.env.get('POSTMARK_API_TOKEN') ?? '');
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
(0, server_ts_1.serve)(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }
    try {
        const { propertyData, priceId, addons, successUrl, cancelUrl } = await req.json();
        // Format email body with a professional template
        const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #003D3C; color: white; padding: 20px; text-align: center; }
            .section { margin: 20px 0; padding: 20px; background: #f9f9f9; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; padding: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Property Analysis Request</h1>
            </div>

            <div class="section">
              <h2>Contact Information</h2>
              <p><strong>Name:</strong> ${propertyData.firstName} ${propertyData.lastName}</p>
              <p><strong>Email:</strong> ${propertyData.email}</p>
              <p><strong>Phone:</strong> ${propertyData.phone}</p>
            </div>

            <div class="section">
              <h2>Entity Information</h2>
              <p><strong>Type:</strong> ${propertyData.entityType}</p>
              <p><strong>Company:</strong> ${propertyData.companyName || 'N/A'}</p>
              <p><strong>Experience Level:</strong> ${propertyData.experienceLevel}</p>
            </div>

            <div class="section">
              <h2>Property Details</h2>
              <p><strong>Address:</strong> ${propertyData.address}</p>
              <p><strong>Square Footage:</strong> ${propertyData.sqft}</p>
              <p><strong>Year Built:</strong> ${propertyData.yearBuilt}</p>
              <p><strong>Current Use:</strong> ${propertyData.currentUse}</p>
            </div>

            <div class="section">
              <h2>Project Information</h2>
              <p><strong>Ownership Status:</strong> ${propertyData.ownershipStatus}</p>
              <p><strong>Intended Use:</strong> ${propertyData.intendedUse}</p>
              <p><strong>Timeline:</strong> ${propertyData.timeline}</p>
              <p><strong>Help Level Needed:</strong> ${propertyData.helpLevel}</p>
            </div>

            <div class="section">
              <h2>Additional Details</h2>
              <p>${propertyData.description || 'None provided'}</p>
            </div>

            <div class="footer">
              <p>This request was submitted through Propvia's platform.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        // Send email using Postmark with error handling
        try {
            await postmark.sendEmail({
                From: 'notifications@propvia.com',
                To: 'hello@propvia.com',
                Subject: `New Property Analysis Request - ${propertyData.address}`,
                HtmlBody: emailHtml,
                TextBody: emailHtml.replace(/<[^>]*>/g, ''), // Strip HTML for text version
                MessageStream: 'outbound',
                Tag: 'property-analysis-request'
            });
        }
        catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Continue with checkout even if email fails
        }
        // Create line items array starting with the main package
        const lineItems = [{
                price: priceId,
                quantity: 1,
            }];
        // Add any selected add-ons
        if (addons && addons.length > 0) {
            addons.forEach((addonPriceId) => {
                lineItems.push({
                    price: addonPriceId,
                    quantity: 1,
                });
            });
        }
        const { propertyRequestId } = req.body;
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                propertyAddress: propertyData.address,
                sqft: propertyData.sqft,
                yearBuilt: propertyData.yearBuilt,
                currentUse: propertyData.currentUse,
                customerName: `${propertyData.firstName} ${propertyData.lastName}`,
                customerEmail: propertyData.email,
                customerPhone: propertyData.phone,
                customPropertyRequestId: propertyRequestId.toString(),
            },
        });
        return new Response(JSON.stringify({ sessionId: session.id }), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
            },
            status: 200,
        });
    }
    catch (error) {
        console.error('Error processing request:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
            },
            status: 400,
        });
    }
});