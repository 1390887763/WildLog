import { supabase } from "./supabase";

const USER_ID = "default_user";

export async function fetchAssetConfig() {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("user_id", USER_ID)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertAssetConfig(config) {
  const { data, error } = await supabase
    .from("assets")
    .upsert(
      {
        user_id: USER_ID,
        monthly_income: config.monthlyIncome || 0,
        year_end_bonus: config.yearEndBonus || 0,
        initial_savings: config.initialSavings || 0,
        annual_return_rate: config.annualReturnRate || 3,
        work_years: config.workYears || 30,
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchMonthlyRecords() {
  const { data, error } = await supabase
    .from("asset_monthly")
    .select("*")
    .eq("user_id", USER_ID)
    .order("year", { ascending: true })
    .order("month", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function saveMonthlyRecord({ year, month, value, isManual }) {
  const { data, error } = await supabase
    .from("asset_monthly")
    .upsert(
      {
        user_id: USER_ID,
        year,
        month,
        value,
        is_manual: isManual ?? true,
      },
      { onConflict: "user_id,year,month" },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function calculateProjection(config, monthlyRecords = []) {
  const {
    monthlyIncome = 0,
    yearEndBonus = 0,
    initialSavings = 0,
    annualReturnRate = 3,
    workYears = 30,
  } = config;

  const monthlyRate = annualReturnRate / 100 / 12;

  const manualMap = new Map();
  for (const r of monthlyRecords) {
    const key = `${r.year}-${String(r.month).padStart(2, "0")}`;
    manualMap.set(key, r);
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const totalMonths = workYears * 12;
  const data = [];
  let currentAsset = initialSavings;

  for (let i = 1; i <= totalMonths; i++) {
    const year = Math.ceil(i / 12);
    const month = ((i - 1) % 12) + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;

    const isManual = manualMap.has(key);
    const isPast =
      year < currentYear || (year === currentYear && month < currentMonth);

    if (isManual) {
      currentAsset = manualMap.get(key).value;
    } else {
      const isDecember = month === 12;
      currentAsset =
        currentAsset * (1 + monthlyRate) +
        monthlyIncome +
        (isDecember ? yearEndBonus : 0);
    }

    data.push({
      year,
      month,
      key,
      label: `${year}.${month}`,
      value: Math.round(currentAsset),
      valueWan: (currentAsset / 10000).toFixed(2),
      isManual,
      isPast,
    });
  }

  return data;
}
