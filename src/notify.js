const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_WHATSAPP_FROM;

const receptionistNumber = process.env.RECEPTIONIST_NUMBER;

if (!accountSid || !authToken) {
  throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN");
}
if (!from) {
  throw new Error("Missing TWILIO_WHATSAPP_FROM");
}
if (!receptionistNumber) {
  throw new Error("Missing RECEPTIONIST_NUMBER");
}

const client = twilio(accountSid, authToken);

function normalizeWhatsApp(number) {
  if (!number) return number;
  if (number.startsWith("whatsapp:")) return number;
  return `whatsapp:${number}`;
}

async function sendWhatsApp(to, body) {
  const msg = await client.messages.create({
    from,
    to: normalizeWhatsApp(to),
    body,
  });

  return msg;
}

function formatReceptionistNotification(appointment) {
  return [
    "🆕 New Appointment Booked",
    `Patient: ${appointment.patient_name}`,
    `Phone: ${appointment.phone}`,
    `Doctor: ${appointment.doctor}`,
    `Date: ${appointment.date}`,
    `Time: ${appointment.time}`,
  ].join("\n");
}

async function notifyReceptionist(appointment) {
  const body = formatReceptionistNotification(appointment);
  return sendWhatsApp(receptionistNumber, body);
}

module.exports = {
  sendWhatsApp,
  notifyReceptionist,
};
