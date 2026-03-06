export type CheckStatus = "pass" | "fail" | "warn" | "manual" | "pending"

export interface CheckResult {
  status: CheckStatus
  detail?: string
  autoChecked: boolean
  link?: string
  note?: string
}

export interface CheckItem {
  id: string
  text: string
  autoKey?: string
  canManual?: boolean
}

export interface Section {
  id: number
  emoji: string
  title: string
  color: string
  bg: string
  items: CheckItem[]
}

export interface InspectorInfo {
  name: string
  dept: string
  date: string
  os: string
}

export interface ReportPayload {
  results: Record<string, CheckResult>
  inspector: InspectorInfo
  format: "pdf" | "excel" | "both"
}
