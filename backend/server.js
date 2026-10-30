'use strict';
/**
 * Athithya Property Solutions — enquiry backend
 * Serves the static site and delivers enquiry form submissions by email (Nodemailer).
 * Credentials come from environment variables only (see ../.env.example).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const TO = process.env.ENQUIRY_TO || 'athithyapropertyconsultant@gmail.com';
const TYPES = ['Real Estate', 'Construction', 'Property Consultation', 'Free Site Visit', 'Other'];

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '20kb' }));

// Serve the static website from the project root
const root = path.join(__dirname, '..');
app.use(express.static(root, { extensions: ['html'], index: 'index.html' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many enquiries from this connection. Please try again later or use WhatsApp.' },
});

function configured() {
  return process.env.SMTP_USER && process.env.SMTP_PASS;
}

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || 'true') === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F]+/g, ' ').trim().slice(0, max);
const cleanMsg = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

app.post('/api/enquiry', limiter, async (req, res) => {
  const b = req.body || {};

  // Honeypot: bots fill this. Respond with a generic failure-free 400 without sending.
  if (b.website) return res.status(400).json({ success: false, message: 'Submission rejected.' });

  const fullName = clean(b.fullName, 100);
  const phone = clean(b.phone, 20);
  const email = clean(b.email, 120);
  const enquiryType = clean(b.enquiryType, 40);
  const message = cleanMsg(b.message, 2000);

  const errors = {};
  if (fullName.length < 2) errors.fullName = 'Name is required.';
  const digits = phone.replace(/[\s\-()+]/g, '');
  if (!/^\d{8,15}$/.test(digits)) errors.phone = 'A valid phone number is required.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Email format is invalid.';
  if (!TYPES.includes(enquiryType)) errors.enquiryType = 'Choose a valid enquiry type.';
  if (message.length < 10) errors.message = 'Message must be at least 10 characters.';
  if (Object.keys(errors).length) {
    return res.status(400).json({ success: false, message: 'Please check the highlighted details and try again.', errors });
  }

  if (!configured()) {
    console.error('SMTP_USER / SMTP_PASS are not set. Enquiry NOT sent.');
    return res.status(503).json({ success: false, message: 'The enquiry service is not available right now. Please contact us on WhatsApp at 9841455995.' });
  }

  const text = [
    'New website enquiry — Athithya Property Solutions',
    '',
    `Name: ${fullName}`,
    `Phone: ${phone}`,
    `Email: ${email || '(not provided)'}`,
    `Enquiry type: ${enquiryType}`,
    '',
    'Message:',
    message,
  ].join('\n');

  const html = `<h2>New website enquiry</h2>
<table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif">
<tr><td><b>Name</b></td><td>${esc(fullName)}</td></tr>
<tr><td><b>Phone</b></td><td>${esc(phone)}</td></tr>
<tr><td><b>Email</b></td><td>${esc(email || '(not provided)')}</td></tr>
<tr><td><b>Enquiry type</b></td><td>${esc(enquiryType)}</td></tr>
<tr><td valign="top"><b>Message</b></td><td>${esc(message).replace(/\n/g, '<br>')}</td></tr></table>`;

  try {
    await getTransporter().sendMail({
      from: `"Athithya Website" <${process.env.SMTP_USER}>`,
      to: TO,
      replyTo: email || undefined,
      subject: `Website enquiry: ${enquiryType} — ${fullName}`,
      text,
      html,
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('Email send failed:', err.message);
    return res.status(502).json({ success: false, message: 'We could not send your enquiry right now. Please try again or contact us on WhatsApp at 9841455995.' });
  }
});

app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'Not found.' }));

if (require.main === module) {
  app.listen(PORT, () => console.log(`Athithya site running on http://localhost:${PORT}`));
}
module.exports = app;
