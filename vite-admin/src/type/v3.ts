export type JsonRecord = Record<string, unknown>;

export type AssetStatus = "active" | "inactive" | "maintenance" | "retired" | "deleted" | string;

export interface Asset {
  id: number;
  uuid: string;
  assetType: string;
  assetNumber: string;
  name: string;
  ownerName: string;
  department: string;
  status: AssetStatus;
  category: string;
  purchasePrice: number;
  residualValue: number;
  metadata: JsonRecord;
  latestObservation?: {
    summary: JsonRecord;
    hardware: JsonRecord;
    observedAt: string;
    source: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AssetInput {
  assetType?: string;
  assetNumber?: string;
  name?: string;
  ownerName?: string;
  department?: string;
  status?: AssetStatus;
  category?: string;
  purchasePrice?: number;
  residualValue?: number;
  metadata?: JsonRecord;
}

export interface AssetEventInput {
  eventType?: string;
  message: string;
  payload?: JsonRecord;
}

export interface AssetReference {
  uuid: string;
  assetNumber: string;
  name: string;
  assetType: string;
  status: string;
  department: string;
  ownerName: string;
}

export interface AssetIdentity {
  id: number;
  assetId: number;
  identityType: string;
  identityValue: string;
  confidence: number;
  isPrimary: boolean;
  source: string;
  createdAt: string;
}

export interface AssetObservation {
  id: number;
  assetId: number;
  source: string;
  schemaVersion: number;
  observedAt: string;
  receivedAt: string;
  summary: JsonRecord;
  hardware: JsonRecord;
  raw: JsonRecord;
  asset?: AssetReference;
}

export interface AssetEvent {
  id: number;
  assetId: number | null;
  eventSource: string;
  eventType: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  message: string;
  actorUserId: number | null;
  actorName: string;
  payload: JsonRecord;
  createdAt: string;
  asset?: AssetReference;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: Pagination;
}

export interface AssetListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  assetType?: string;
  assetScope?: "computer" | "other" | "all";
  status?: string;
  department?: string;
  category?: string;
}

export interface EventListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  eventSource?: string;
  eventType?: string;
}

export interface ObservationListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  source?: string;
}

export interface ClientToken {
  id: string;
  name: string;
  enabled: boolean;
  createdAt: string;
}

export interface CreatedClientToken extends ClientToken {
  secret: string;
}

export interface InventorySettings {
  publicQueryEnabled: boolean;
  observationRetentionDays: number;
  assetNumberPrefix: string;
  clientTokens: ClientToken[];
}
