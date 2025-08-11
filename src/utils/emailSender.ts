import postmarkClient from './postmarkClient';
import { generatePdf } from './pdfGenerator';
import { CustomPropertyType } from '../types';

export async function sendConfirmationEmail(toEmail: string, formData: CustomPropertyType) {
  const pdfBuffer = await generatePdf(formData);
  const base64EncodedPdf = pdfBuffer.toString('base64');

  const attachment = {
    Name: 'Custom_Report_Summary.pdf',
    Content: base64EncodedPdf,
    ContentType: 'application/pdf',
    ContentID: 'custom-report-pdf'
  };

  // 1. Send to Customer
  await postmarkClient.sendEmail({
    From: process.env.POSTMARK_SENDER!,
    To: toEmail,
    Subject: 'Your Custom Report Order is Confirmed',
    HtmlBody: `
      <h2>Hi ${formData.first_name},</h2>
      <p>Thank you for purchasing a custom report from Propvia.</p>
      <p>We've attached a summary of your submission as a PDF. Please verify the submitted details are accurate.</p>
      <p>We will get back to you soon with the analysis for your request</p>
      <p>In the meantime please feel free to explore our features or schedule a call with us using the link below.</p>
      <p><strong>Schedule your consultation here:</strong><br>
      <a href="https://calendly.com/hello-propvia/30min">Book a 30-minute call</a></p>
    `,
    Attachments: [attachment],
    MessageStream: 'outbound'
  });

  // 2. Send to Propvia Internal Team
  await postmarkClient.sendEmail({
    From: process.env.POSTMARK_SENDER!,
    To: 'intern@propvia.com',
    Subject: 'New Custom Report Submission',
    HtmlBody: `
      <h3>New custom report submission received</h3>
      <p><strong>Customer:</strong> ${formData.first_name} (${toEmail})</p>
      <p>See attached PDF for full submission details.</p>
    `,
    Attachments: [attachment],
    MessageStream: 'outbound'
  });
}
