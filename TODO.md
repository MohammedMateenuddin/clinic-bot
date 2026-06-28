# clinic-bot - TODO

- [x] Create `clinic-bot/index.js` with basic Express server + `/webhook` route wiring to flow
- [x] Create `clinic-bot/src/supabase.js` with Supabase CRUD functions:
  - saveAppointment
  - getTomorrowAppointments
  - getTodayByDoctor
  - markReminded
- [x] Create `clinic-bot/src/notify.js` with Twilio WhatsApp sender + receptionist notification
- [x] Create `clinic-bot/src/flow.js` implementing the step-by-step conversation state machine
- [x] Create `clinic-bot/src/webhook.js` tying Twilio webhook + flow + Supabase + notify
- [x] Create `clinic-bot/src/scheduler.js` with two node-cron jobs:
  - 8 PM reminders for tomorrow’s unreminded appointments
  - 8 AM morning summaries per doctor for today’s appointments
- [x] Create `clinic-bot/package.json`
- [x] Create `clinic-bot/.env` (copy template values as placeholders)
- [ ] Run locally & verify with ngrok + Twilio webhook (manual testing)
- [ ] Deploy to Render
