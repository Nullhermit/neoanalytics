import type { Dataset } from "./types";
import { buildDataset } from "./parse";

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function householdDemo(): Dataset {
  const r = rand(7);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const rows = months.map((m, i) => {
    const income = 85000 + Math.round(r() * 5000);
    const rent = 22000;
    const groceries = 8000 + Math.round(r() * 3000);
    const dining = 4000 + Math.round(r() * 5000);
    const transport = 3500 + Math.round(r() * 1500);
    const utilities = 2500 + Math.round(r() * 800);
    const entertainment = 2000 + Math.round(r() * 3000);
    const savings = income - rent - groceries - dining - transport - utilities - entertainment;
    return { Month: m, Income: income, Rent: rent, Groceries: groceries, Dining: dining, Transport: transport, Utilities: utilities, Entertainment: entertainment, Savings: savings, MonthIndex: i + 1 };
  });
  return buildDataset("household_budget_demo.csv", rows);
}

export function salesDemo(): Dataset {
  const r = rand(42);
  const rows = Array.from({ length: 120 }, (_, i) => {
    const region = ["North","South","East","West"][i % 4];
    const product = ["Alpha","Beta","Gamma","Delta","Epsilon"][i % 5];
    const units = Math.round(40 + r() * 200);
    const price = Math.round(50 + r() * 400);
    const revenue = units * price;
    const cost = Math.round(revenue * (0.4 + r() * 0.3));
    const profit = revenue - cost;
    return { OrderId: 1000 + i, Region: region, Product: product, Units: units, Price: price, Revenue: revenue, Cost: cost, Profit: profit, Day: i + 1 };
  });
  return buildDataset("sales_analytics_demo.csv", rows);
}

export function churnDemo(): Dataset {
  const r = rand(99);
  const rows = Array.from({ length: 200 }, (_, i) => ({
    UserId: i + 1,
    TenureMonths: Math.round(1 + r() * 60),
    MonthlySpend: Math.round(200 + r() * 1800),
    SupportTickets: Math.round(r() * 12),
    Churned: r() > 0.72 ? 1 : 0,
  }));
  return buildDataset("ecommerce_churn.csv", rows);
}

export function fraudDemo(): Dataset {
  const r = rand(13);
  const rows = Array.from({ length: 200 }, (_, i) => ({
    TxnId: i + 1,
    Amount: Math.round(50 + r() * 9950),
    Country: ["IN","US","UK","DE","SG","BR"][i % 6],
    RiskScore: +(r() * 100).toFixed(1),
    Fraud: r() > 0.92 ? 1 : 0,
  }));
  return buildDataset("fintech_fraud.csv", rows);
}

export function healthcareDemo(): Dataset {
  const r = rand(21);
  const rows = Array.from({ length: 150 }, (_, i) => ({
    PatientId: i + 1,
    Department: ["ER","Cardio","Ortho","Pediatrics","Neuro"][i % 5],
    WaitMinutes: Math.round(5 + r() * 240),
    Severity: Math.round(1 + r() * 4),
    Satisfaction: +(r() * 5).toFixed(2),
  }));
  return buildDataset("healthcare_waits.csv", rows);
}

export const DEMO_DATASETS = [
  { id: "household", label: "Household Budget (Personal)", build: householdDemo },
  { id: "sales", label: "Sales Analytics (Large)", build: salesDemo },
  { id: "churn", label: "E-commerce Churn", build: churnDemo },
  { id: "fraud", label: "Fintech Fraud Detection", build: fraudDemo },
  { id: "healthcare", label: "Healthcare Wait Times", build: healthcareDemo },
] as const;