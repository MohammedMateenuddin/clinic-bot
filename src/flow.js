const { DateTime } = require("luxon");

const sessions = {};

const DOCTORS = [
  {
    name: process.env.DOCTOR_1_NAME || "Dr. Sharma",
    phone: process.env.DOCTOR_1_PHONE || "",
  },
  {
    name: process.env.DOCTOR_2_NAME || "Dr. Priya",
    phone: process.env.DOCTOR_2_PHONE || "",
  },
];

const TIME_SLOTS = ["10:00 AM", "11:30 AM", "3:00 PM"];

function getSession(phone) {
  if (!sessions[phone]) {
    sessions[phone] = {
      step: "start",
      doctor: "",
      date: "",
      time: "",
      patient_name: "",
    };
  }
  return sessions[phone];
}

function resetSession(phone) {
  sessions[phone] = {
    step: "start",
    doctor: "",
    date: "",
    time: "",
    patient_name: "",
  };
}

function isValidDoctor(input) {
  const norm = (input || "").toLowerCase().trim();
  return DOCTORS.find((d) => d.name.toLowerCase() === norm) || null;
}

function normalizeDateChoices(input) {
  const clean = (input || "").toLowerCase().trim();
  if (clean === "tomorrow" || clean === "1") return "tomorrow";
  if (clean === "day after tomorrow" || clean === "2")
    return "day_after_tomorrow";
  // Accept dates in YYYY-MM-DD if provided
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  return null;
}

function formatNextTwoDates() {
  const tomorrow = DateTime.now().plus({ days: 1 }).toISODate();
  const dayAfter = DateTime.now().plus({ days: 2 }).toISODate();
  return { tomorrow, dayAfter };
}

function resolveDate(input) {
  const choice = normalizeDateChoices(input);
  if (!choice) return null;
  const { tomorrow, dayAfter } = formatNextTwoDates();
  if (choice === "tomorrow") return tomorrow;
  if (choice === "day_after_tomorrow") return dayAfter;
  return choice; // YYYY-MM-DD
}

function isValidTimeSlot(input) {
  const clean = (input || "").toLowerCase().trim();
  const match = TIME_SLOTS.find((t) => t.toLowerCase() === clean);
  return match || null;
}

function doctorsMenuText() {
  return `Choose doctor:\n1. ${DOCTORS[0].name}\n2. ${DOCTORS[1].name}`;
}

function datesMenuText() {
  const { tomorrow, dayAfter } = formatNextTwoDates();
  return `Choose date:\n1. Tomorrow (${tomorrow})\n2. Day after tomorrow (${dayAfter})`;
}

function timeSlotsMenuText() {
  return `Choose time slot:\n${TIME_SLOTS.map((t, i) => `${i + 1}. ${t}`).join("\n")}`;
}

function docToDoctorName(doctorNameOrIndex) {
  const clean = (doctorNameOrIndex || "").toLowerCase().trim();
  if (clean === "1") return DOCTORS[0].name;
  if (clean === "2") return DOCTORS[1].name;
  const d = isValidDoctor(doctorNameOrIndex);
  return d ? d.name : null;
}

function timeSlotFromIndexOrValue(input) {
  const clean = (input || "").toLowerCase().trim();
  if (clean === "1") return TIME_SLOTS[0];
  if (clean === "2") return TIME_SLOTS[1];
  if (clean === "3") return TIME_SLOTS[2];
  return isValidTimeSlot(input);
}

function buildConfirmText(session) {
  const prettyDate = session.date;
  return [
    `Please confirm:`,
    `Doctor: ${session.doctor}`,
    `Date: ${prettyDate}`,
    `Time: ${session.time}`,
    `Name: ${session.patient_name}`,
    `\nReply YES to confirm or NO to restart.`,
  ].join("\n");
}

async function processMessage({ phone, message }) {
  const session = getSession(phone);
  const text = (message || "").trim();

  // Global exits
  if (/^restart$/i.test(text)) {
    resetSession(phone);
    return "Restarted. Send any message to begin.";
  }

  if (session.step === "start") {
    session.step = "choose_doctor";
    return `Hi! 👋 Welcome to City Clinic.\n${doctorsMenuText()}\nReply with 1 or 2 (or the doctor name).`;
  }

  if (session.step === "choose_doctor") {
    const doctor = docToDoctorName(text);
    if (!doctor) {
      resetSession(phone);
      return "Invalid choice. Restarting booking. Please reply with 1 or 2 to choose a doctor.";
    }
    session.doctor = doctor;
    session.step = "choose_date";
    return datesMenuText() + "\nReply with 1 or 2.";
  }

  if (session.step === "choose_date") {
    const dt = resolveDate(text);
    const tomorrow = formatNextTwoDates().tomorrow;
    const dayAfter = formatNextTwoDates().dayAfter;

    if (!dt || (dt !== tomorrow && dt !== dayAfter)) {
      resetSession(phone);
      return "Invalid date. Restarting booking. Please choose:\n1. Tomorrow\n2. Day after tomorrow";
    }

    session.date = dt;
    session.step = "choose_slot";
    return timeSlotsMenuText() + "\nReply with 1, 2, or 3.";
  }

  if (session.step === "choose_slot") {
    const slot = timeSlotFromIndexOrValue(text);
    if (!slot) {
      resetSession(phone);
      return "Invalid time slot. Restarting booking. Please choose time slot: 1, 2, or 3.";
    }
    session.time = slot;
    session.step = "get_name";
    return "Enter your name:";
  }

  if (session.step === "get_name") {
    const name = text;
    if (!name || name.length < 2) {
      resetSession(phone);
      return "Invalid name. Restarting booking. Enter your name again.";
    }
    session.patient_name = name;
    session.step = "confirm";
    return buildConfirmText(session);
  }

  if (session.step === "confirm") {
    const clean = text.toLowerCase();
    if (clean === "yes" || clean === "y") {
      session.step = "done";
      const appointment = {
        patient_name: session.patient_name,
        phone,
        doctor: session.doctor,
        date: session.date,
        time: session.time,
      };
      resetSession(phone);
      return appointment;
    }
    if (clean === "no" || clean === "n") {
      resetSession(phone);
      return "Okay, restarting booking. Reply with 1 or 2 to choose a doctor.";
    }
    resetSession(phone);
    return "Invalid input. Restarting booking. Reply with YES to confirm.";
  }

  // done or unexpected
  resetSession(phone);
  return "Let’s start again. Choose doctor: 1 or 2.";
}

module.exports = {
  processMessage,
  sessions,
  DOCTORS,
  TIME_SLOTS,
};
