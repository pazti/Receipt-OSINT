// Local sample data — replaced by live bot results once the Telegram bot is connected.
export const sampleChecks = [
  {
    id: "sample-1",
    sender_name: "Chidi Obi",
    sender_username: "@chidi_obi",
    from_bank: "GTBank",
    to_bank: "OPay",
    amount: 50000,
    verdict: "real",
    risk_score: 2,
    created_date: "2026-11-04T10:32:00",
  },
  {
    id: "sample-2",
    sender_name: "Ngozi Eze",
    sender_username: "@ngozie",
    from_bank: "Kuda",
    to_bank: "Moniepoint",
    amount: 200000,
    verdict: "fake",
    risk_score: 94,
    created_date: "2026-11-04T10:28:00",
  },
  {
    id: "sample-3",
    sender_name: "Emeka Uche",
    sender_username: "@emekau",
    from_bank: "Access",
    to_bank: "PalmPay",
    amount: 87500,
    verdict: "suspicious",
    risk_score: 41,
    created_date: "2026-11-04T10:19:00",
  },
  {
    id: "sample-4",
    sender_name: "Aisha Bello",
    sender_username: "@aishab",
    from_bank: "Zenith",
    to_bank: "GTBank",
    amount: 120000,
    verdict: "real",
    risk_score: 6,
    created_date: "2026-11-04T10:04:00",
  },
];

export const sampleStats = [
  { label: "Checks today", value: "18", sub: "4 traders" },
  { label: "Flagged fake", value: "3", sub: "17% of checks" },
  { label: "Value reviewed", value: "₦2.4m", sub: "today" },
  { label: "Median read", value: "4.1s", sub: "screenshot to verdict" },
];