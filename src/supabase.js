const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_KEY in environment variables",
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

function toISODate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function saveAppointment({ patient_name, phone, doctor, date, time }) {
  const payload = {
    patient_name,
    phone,
    doctor,
    date, // YYYY-MM-DD
    time,
    reminded: false,
  };

  const { data, error } = await supabase
    .from("appointments")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getTomorrowAppointments() {
  const tomorrow = addDays(new Date(), 1);
  const tomorrowStr = toISODate(tomorrow);

  const { data, error } = await supabase
    .from("appointments")
    .select("id, patient_name, phone, doctor, date, time, reminded")
    .eq("date", tomorrowStr)
    .eq("reminded", false);

  if (error) throw error;
  return data || [];
}

async function getTodayByDoctor(doctor) {
  const today = new Date();
  const todayStr = toISODate(today);

  const { data, error } = await supabase
    .from("appointments")
    .select("id, patient_name, phone, doctor, date, time, reminded")
    .eq("doctor", doctor)
    .eq("date", todayStr);

  if (error) throw error;
  return data || [];
}

async function markReminded(id) {
  const { data, error } = await supabase
    .from("appointments")
    .update({ reminded: true })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  saveAppointment,
  getTomorrowAppointments,
  getTodayByDoctor,
  markReminded,
};
