const { processMessage } = require("./flow");
const { saveAppointment } = require("./supabase");
const { notifyReceptionist, sendWhatsApp } = require("./notify");
const { sendReminderAfterBooking } = require("./scheduler");

function getBodyText(req) {
  return req.body && req.body.Body ? req.body.Body : "";
}

function getFromPhone(req) {
  return req.body && req.body.From ? req.body.From : "";
}

async function handleWebhook(req, res) {
  try {
    const phone = getFromPhone(req);
    const message = getBodyText(req);

    const result = await processMessage({ phone, message });

    if (typeof result === "string") {
      await sendWhatsApp(phone, result);
      return res.status(200).send("OK");
    }

    if (result && typeof result === "object") {
      const appointment = result;

      await saveAppointment(appointment);
      await notifyReceptionist(appointment);

      const confirmText = [
        `✅ Appointment booked successfully!`,
        `Doctor: ${appointment.doctor}`,
        `Date: ${appointment.date}`,
        `Time: ${appointment.time}`,
      ].join("\n");

      await sendWhatsApp(phone, confirmText);

      // Send reminder 2 mins after booking
      sendReminderAfterBooking(appointment);

      return res.status(200).send("OK");
    }

    await sendWhatsApp(phone, "Sorry, something went wrong. Please try again.");
    return res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).send("ERROR");
  }
}

module.exports = {
  handleWebhook,
};
