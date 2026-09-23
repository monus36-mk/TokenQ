import nodemailer from 'nodemailer';

export async function sendPrescriptionEmail({
  toEmail,
  patientName,
  doctorName,
  clinicName,
  clinicAddress,
  tokenNumber,
  medicines = [],
  clinicalNotes = '',
  prescriptionText = '',
  followUpDate = null,
  followUpNotes = ''
}) {
  if (!toEmail || !toEmail.includes('@')) {
    return { success: false, error: 'No valid recipient email provided' };
  }

  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    const smtpUsername = process.env.SMTP_USERNAME;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const emailUser = process.env.EMAIL_USER || 'rare36monus@gmail.com';
    const emailPass = process.env.EMAIL_PASS;

    let transporter;
    let fromEmail;

    if (smtpHost && smtpUsername && smtpPassword) {
      fromEmail = smtpUsername.trim();
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: fromEmail,
          pass: smtpPassword
        }
      });
    } else if (emailPass) {
      fromEmail = emailUser;
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass
        }
      });
    } else {
      console.log(`[DEV MODE] Simulated Email Sent to ${toEmail} for Token #${tokenNumber}`);
      return { success: true, simulated: true };
    }

    const formattedFollowUp = followUpDate 
      ? new Date(followUpDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : null;

    // Medicines rows HTML
    const medsRowsHtml = (medicines && medicines.length > 0)
      ? medicines.map((m, idx) => `
          <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="padding: 10px 12px; font-weight: 600; color: #1e293b;">${m.name || 'Medicine'}</td>
            <td style="padding: 10px 12px; color: #2563eb; font-family: monospace; font-weight: 700;">${m.dosage || '1-0-1'}</td>
            <td style="padding: 10px 12px; color: #475569;">${m.timing || 'After Food'}</td>
            <td style="padding: 10px 12px; color: #475569;">${m.duration || '3 Days'}</td>
            <td style="padding: 10px 12px; color: #64748b; font-size: 12px;">${m.instructions || '—'}</td>
          </tr>
        `).join('')
      : '';

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 24px; color: white; text-align: center;">
          <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Token<span style="color: #a7f3d0;">Q</span> Health</div>
          <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">Digital Prescription & Checkup Advice</div>
        </div>

        <!-- Clinic & Patient Meta -->
        <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${clinicName || 'Medical Clinic'}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${clinicAddress || 'Thanjavur, Tamil Nadu'}</div>
              <div style="font-size: 13px; color: #059669; font-weight: 600; margin-top: 4px;">Dr. ${doctorName || 'Doctor'}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700;">Token #</div>
              <div style="font-size: 20px; font-weight: 800; color: #059669;">${tokenNumber || '—'}</div>
              <div style="font-size: 11px; color: #64748b;">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            </div>
          </div>
        </div>

        <div style="padding: 24px;">
          <!-- Greeting -->
          <div style="font-size: 15px; color: #334155; margin-bottom: 16px;">
            Hello <strong>${patientName || 'Patient'}</strong>, here is your digital medical consultation summary from Dr. ${doctorName || 'Doctor'}:
          </div>

          <!-- Follow-up Alert Box (if present) -->
          ${formattedFollowUp ? `
            <div style="background: #fef3c7; border: 1.5px solid #fcd34d; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
              <div style="font-size: 13px; font-weight: 700; color: #92400e; display: flex; align-items: center; gap: 6px;">
                ⏰ Scheduled Follow-up Checkup
              </div>
              <div style="font-size: 15px; font-weight: 800; color: #78350f; margin-top: 4px;">
                ${formattedFollowUp}
              </div>
              ${followUpNotes ? `<div style="font-size: 12px; color: #b45309; margin-top: 4px;">Advice: ${followUpNotes}</div>` : ''}
              <div style="font-size: 11px; color: #92400e; margin-top: 6px;">
                You will also receive automated in-app reminders on your TokenQ patient portal.
              </div>
            </div>
          ` : ''}

          <!-- Doctor's Notes & Advice -->
          ${clinicalNotes ? `
            <div style="background: #f1f5f9; border-left: 4px solid #3b82f6; border-radius: 0 6px 6px 0; padding: 12px 14px; margin-bottom: 20px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">📋 Doctor's Notes & Diagnosis:</div>
              <div style="font-size: 13px; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">${clinicalNotes}</div>
            </div>
          ` : ''}

          <!-- Prescribed Medicines -->
          ${medsRowsHtml ? `
            <div style="margin-bottom: 20px;">
              <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                <span style="color: #10b981; font-weight: 900; font-size: 16px;">℞</span> Prescribed Medicines:
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
                <thead>
                  <tr style="background: #f1f5f9; color: #475569;">
                    <th style="padding: 8px 12px;">Medicine</th>
                    <th style="padding: 8px 12px;">Dosage</th>
                    <th style="padding: 8px 12px;">Timing</th>
                    <th style="padding: 8px 12px;">Duration</th>
                    <th style="padding: 8px 12px;">Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  ${medsRowsHtml}
                </tbody>
              </table>
            </div>
          ` : ''}

          ${prescriptionText ? `
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px 14px; margin-bottom: 20px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #047857; margin-bottom: 4px;">💊 Additional Rx Instructions:</div>
              <div style="font-size: 13px; color: #064e3b; line-height: 1.5; white-space: pre-wrap;">${prescriptionText}</div>
            </div>
          ` : ''}

          <!-- Footer button -->
          <div style="text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <div style="font-size: 12px; color: #64748b; margin-bottom: 12px;">
              View and download your digital prescription anytime from your TokenQ app:
            </div>
            <a href="http://localhost:3005" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 13px;">
              Open TokenQ Patient Portal
            </a>
          </div>
        </div>

        <!-- Email Footer -->
        <div style="background: #f8fafc; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          This is an automated prescription & consultation summary from TokenQ. Please consult your physician if you experience any adverse effects.
        </div>
      </div>
    `;

    const mailOptions = {
      from: `TokenQ Clinic <${fromEmail}>`,
      to: toEmail.trim().toLowerCase(),
      subject: `💊 Digital Prescription & Checkup Advice from Dr. ${doctorName || 'Doctor'} (Token #${tokenNumber})`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending prescription email:', error);
    return { success: false, error: error.message };
  }
}
