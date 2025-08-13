import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const seedStages = async () => {
  const stages = [
    {
      dataOrder: 1,
      name: "registration",
      name_en: "Registration",
      name_de: "Registrierung",
      name_nl: "Registratie",
      name_id: "Registrasi",
      name_ph: "Rehistrasyon",
      color: "#6B7280",
    },
    {
      dataOrder: 2,
      name: "eligibility_check",
      name_en: "Eligibility Check",
      name_de: "Anspruchsprüfung",
      name_nl: "Verzekeringscontrole",
      name_id: "Cek Kelayakan",
      name_ph: "Pagsusuri ng Saklaw",
      color: "#3B82F6",
    },
    {
      dataOrder: 3,
      name: "appointment_scheduled",
      name_en: "Appointment Scheduled",
      name_de: "Termin geplant",
      name_nl: "Afspraak gepland",
      name_id: "Jadwal Dibuat",
      name_ph: "Naiskedyul na Appt.",
      color: "#0EA5E9",
    },
    {
      dataOrder: 4,
      name: "checked_in",
      name_en: "Checked-in",
      name_de: "Eingecheckt",
      name_nl: "Ingecheckt",
      name_id: "Check-in",
      name_ph: "Naka-check in",
      color: "#06B6D4",
    },
    {
      dataOrder: 5,
      name: "assessment_billed",
      name_en: "Assessment Billed",
      name_de: "Bewertung verrechnet",
      name_nl: "Beoordeling gefactureerd",
      name_id: "Asesmen Ditagih",
      name_ph: "Sinisingil na Pagsuri",
      color: "#8B5CF6",
    },
    {
      dataOrder: 6,
      name: "plan_consented",
      name_en: "Plan Consented",
      name_de: "Plan zugestimmt",
      name_nl: "Plan goedgekeurd",
      name_id: "Rencana Disetujui",
      name_ph: "May pahintulot ang Plano",
      color: "#10B981",
    },
    {
      dataOrder: 7,
      name: "active_billing",
      name_en: "Active Billing",
      name_de: "Aktive Abrechnung",
      name_nl: "Actieve facturatie",
      name_id: "Tagihan Aktif",
      name_ph: "Aktibong Pagsingil",
      color: "#16A34A",
    },
    {
      dataOrder: 8,
      name: "invoiced",
      name_en: "Invoiced / Claim Sent",
      name_de: "Rechnung/Anspruch gesendet",
      name_nl: "Gefactureerd",
      name_id: "Tagihan Dikirim",
      name_ph: "Naipadalang Invoice",
      color: "#22C55E",
    },
    { dataOrder: 9, name: "paid", name_en: "Paid", name_de: "Bezahlt", name_nl: "Betaald", name_id: "Lunas", name_ph: "Bayad", color: "#84CC16" },

    // Branch outcomes
    {
      dataOrder: 10,
      name: "no_show",
      name_en: "No-show",
      name_de: "Nicht erschienen",
      name_nl: "Niet verschenen",
      name_id: "Tidak Hadir",
      name_ph: "Hindi Dumating",
      color: "#EF4444",
    },
    {
      dataOrder: 11,
      name: "cancelled",
      name_en: "Cancelled",
      name_de: "Storniert",
      name_nl: "Geannuleerd",
      name_id: "Dibatalkan",
      name_ph: "Kanselado",
      color: "#F97316",
    },
    {
      dataOrder: 12,
      name: "bad_debt",
      name_en: "Bad Debt / Write-off",
      name_de: "Uneinbringlich",
      name_nl: "Oninbaar",
      name_id: "Piutang Macet",
      name_ph: "Bad Debt",
      color: "#DC2626",
    },
  ] as const;

  for (const s of stages) {
    await prisma.stages.upsert({
      where: { name: s.name },
      update: {
        dataOrder: s.dataOrder,
        name_en: s.name_en,
        name_de: s.name_de,
        name_nl: s.name_nl,
        name_id: s.name_id,
        name_ph: s.name_ph,
        color: s.color,
      },
      create: { ...s },
    });
    console.log(`✅ upserted: ${s.name}`);
  }
};
