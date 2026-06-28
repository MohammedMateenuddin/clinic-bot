const cron = require("node-cron");
const {
  getTomorrowAppointments,
  getTodayByDoctor,
  markReminded,
} = require("./supabase");
const { sendWhatsApp } = require("./notify");
const { DOCTORS } = require("./flow");

function formatPatientReminder(appointment) {
  return [
    "🔔 Reminder! You have an appointment tomorrow.",
    `Doctor: ${appointment.doctor}`,
    `Time: ${appointment.time}`,
    "City Clinic",
  ].join("\n");
}

function formatDoctorMorningSummary(doctorName, appointments) {
  const lines = [
    `Good morning ${doctorName} 🌅`,
    "Your appointments today:",
    ...appointments.map(
      (a, idx) => `${idx + 1}. ${a.time} — ${a.patient_name}`,
    ),
    "",
    "Have a great day!",
  ];
  return lines.join("\n");
}

function getDoctorConfig() {
  // DOCTORS items include name and phone from env in flow.js
  return DOCTORS.filter((d) => d && d.name);
}

function startSchedulers() {
  // 8 PM nightly: reminders for tomorrow unreminded appointments
  cron.schedule("0 20 * * *", async () => {
    try {
      const appointments = await getTomorrowAppointments();

      for (const appt of appointments) {
        // Send reminder to patient
        const body = formatPatientReminder(appt);
        await sendWhatsApp(appt.phone, body);

        // Mark reminded
        await markReminded(appt.id);
      }
    } catch (err) {
      console.error("Nightly reminder job failed:", err);
    }
  });

  // 8 AM daily: morning summary per doctor for today's appointments
  cron.schedule("0 8 * * *", async () => {
    try {
      const doctors = getDoctorConfig();

      for (const doctor of doctors) {
        if (!doctor.phone) continue;

        const appointments = await getTodayByDoctor(doctor.name);
        if (!appointments.length) continue;

        const body = formatDoctorMorningSummary(doctor.name, appointments);
        await sendWhatsApp(doctor.phone, body);
      }
    } catch (err) {
      console.error("Morning summary job failed:", err);
    }
  });
}

module.exports = { startSchedulers };
