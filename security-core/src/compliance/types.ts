export interface ComplianceReport {
  id: string;
  type: 'FinCEN' | 'State';
  data: Record<string, unknown>;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
}

export interface ReportConfig {
  reportType: 'FinCEN' | 'State';
  state?: string;
  period: {
    start: Date;
    end: Date;
  };
}