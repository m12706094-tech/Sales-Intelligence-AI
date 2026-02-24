export interface Column {
  name: string;
  type: string;
  description?: string;
}

export interface Schema {
  table: string;
  columns: Column[];
}

export interface QueryResult {
  results: any[];
  query: string;
  error?: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  query?: string;
  data?: any[];
  chartType?: "line" | "bar" | "pie" | "table";
  insight?: string;
}
