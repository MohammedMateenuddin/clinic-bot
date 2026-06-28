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
  return DOCTORS.filter((d) => d && d.name);
}

function startSchedulers() {
  // TEST: Patient reminder at 10:55 AM IST (change back to '0 20 * * *' after test)
  cron.schedule(
    "55 10 * * *",
    async () => {
      try {
        console.log("⏰ Reminder job started...");
        const appointments = await getTomorrowAppointments();
        console.log(`Found ${appointments.length} appointments to remind`);

        for (const appt of appointments) {
          const body = formatPatientReminder(appt);
          await sendWhatsApp(appt.phone, body);
          await markReminded(appt.id);
          console.log(`✅ Reminded: ${appt.patient_name}`);
        }
      } catch (err) {
        console.error("Nightly reminder job failed:", err);
      }
    },
    {
      timezone: "Asia/Kolkata",
    },
  );

  // Doctor morning summary — 8 AM IST daily
  cron.schedule(
    "0 8 * * *",
    async () => {
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
    },
    {
      timezone: "Asia/Kolkata",
    },
  );
}

module.exports = { startSchedulers };
