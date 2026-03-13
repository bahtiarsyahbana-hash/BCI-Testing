export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Superadmin' | 'Broker Staff' | 'Supervisor';
}

export interface Claim {
  id: number;
  claim_number: string;
  client_name: string;
  policy_number: string;
  insurance_type: string;
  insurer_name: string;
  date_of_loss: string;
  date_reported: string;
  claim_amount: number;
  currency: string;
  status: string;
  last_update_date: string;
  settlement_amount: number | null;
  settlement_date: string | null;
  remarks: string | null;
}

export interface Activity {
  id: number;
  claim_id: number;
  date: string;
  user_id: number;
  user_name: string;
  activity: string;
  notes: string | null;
}

export interface Document {
  id: number;
  claim_id: number;
  document_type: string;
  filename: string;
  url: string;
  upload_date: string;
}

export interface DashboardMetrics {
  totalActive: number;
  settled: number;
  underReview: number;
  delayed: number;
  rejected: number;
}

export interface DashboardAging {
  newClaims: number;
  inProgress: number;
  delayed: number;
  escalation: number;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  aging: DashboardAging;
  charts: {
    statusChart: ChartData[];
    insurerChart: ChartData[];
    typeChart: ChartData[];
  };
}
