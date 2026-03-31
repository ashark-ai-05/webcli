export interface AdapterDefinition {
  site: string; name: string; description: string; version: number; created_by: 'discovery' | 'manual';
  source: AdapterSource; args: Record<string, ArgDefinition>; schema: SchemaDefinition; pipeline: PipelineStep[]; columns: string[];
}
export interface AdapterSource { type: 'api' | 'rss' | 'html' | 'browser'; base_url: string; auth: 'none' | 'api_key' | 'oauth' | 'browser_session'; rate_limit?: { requests: number; per: number; }; }
export interface ArgDefinition { type: 'string' | 'number' | 'boolean'; default?: string | number | boolean; required?: boolean; positional?: boolean; description?: string; choices?: (string | number)[]; }
export interface SchemaDefinition { type: string; entity: string; fields: Record<string, FieldDefinition>; update_frequency?: string; }
export interface FieldDefinition { role: 'id' | 'title' | 'url' | 'timestamp' | 'score' | 'value' | 'delta' | 'metric' | 'author' | 'content' | 'other'; unit?: string; }
export type PipelineStep = | { fetch: FetchStepConfig } | { rss: RssStepConfig } | { browse: BrowseStepConfig } | { select: string } | { transform: string } | { map: Record<string, string> } | { filter: string } | { sort: SortStepConfig } | { limit: string | number } | { flatten: string } | { dedupe: string };
export interface FetchStepConfig { url: string; method?: 'GET' | 'POST'; params?: Record<string, string | number | boolean>; headers?: Record<string, string>; }
export interface RssStepConfig { url: string; }
export interface BrowseStepConfig { url: string; wait?: string; extract: string; }
export interface SortStepConfig { field: string; order?: 'asc' | 'desc'; }
export interface PipelineContext { args: Record<string, unknown>; source: AdapterSource; data: unknown; }
export interface Endpoint { url: string; method: string; content_type: string; sample_response?: unknown; }
export interface ProbeResult { confidence: number; endpoints: Endpoint[]; auth_required: boolean; suggested_adapter: Partial<AdapterDefinition>; }
export type OutputFormat = 'table' | 'json' | 'csv' | 'raw';
