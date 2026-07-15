import { restInstance, type RequestConfig } from "@/services/axiosConfig";
import type {
  Asset,
  AssetEvent,
  AssetEventInput,
  AssetIdentity,
  AssetInput,
  AssetListParams,
  AssetObservation,
  BatchAssetContext,
  BatchAssetResult,
  AnalysisTrends,
  BackupExportResult,
  BackupExportSection,
  BackupRestoreResult,
  ClientToken,
  CreatedClientToken,
  CreatedPublicQueryPage,
  EventListParams,
  InventorySettings,
  IdentityAudit,
  DeviceIdentityReconciliation,
  DeviceIdentityReconciliationApplyResult,
  IssueStates,
  ObservationListParams,
  PaginatedResult,
} from "@/type/v3";

interface DataEnvelope<T> {
  data: T;
}

const unwrapData = <T>(payload: DataEnvelope<T>): T => payload.data;

export const getAssets = async (
  params: AssetListParams
): Promise<PaginatedResult<Asset>> => {
  const response = await restInstance.get<PaginatedResult<Asset>>("/assets", {
    params,
    showSuccessMessage: false,
  } as RequestConfig);
  return response.data;
};

export const getAsset = async (uuid: string): Promise<Asset> => {
  const response = await restInstance.get<DataEnvelope<Asset>>(`/assets/${uuid}`, {
    showSuccessMessage: false,
  } as RequestConfig);
  return unwrapData(response.data);
};

export const createAsset = async (input: AssetInput): Promise<Asset> => {
  const response = await restInstance.post<DataEnvelope<Asset>>("/assets", input, {
    showSuccessMessage: false,
  } as RequestConfig);
  return unwrapData(response.data);
};

export const updateAsset = async (
  uuid: string,
  input: AssetInput
): Promise<Asset> => {
  const response = await restInstance.patch<DataEnvelope<Asset>>(
    `/assets/${uuid}`,
    input,
    { showSuccessMessage: false } as RequestConfig
  );
  return unwrapData(response.data);
};

export const archiveAsset = async (uuid: string): Promise<Asset> => {
  const response = await restInstance.delete<DataEnvelope<Asset>>(`/assets/${uuid}`, {
    showSuccessMessage: false,
  } as RequestConfig);
  return unwrapData(response.data);
};

export const batchAssets = async (
  operation: "archive" | "update",
  uuids: string[],
  changes?: AssetInput,
  context?: BatchAssetContext
): Promise<BatchAssetResult> => {
  const response = await restInstance.post<DataEnvelope<BatchAssetResult>>(
    "/assets/batch",
    { operation, uuids, changes, context },
    { showSuccessMessage: false } as RequestConfig
  );
  return unwrapData(response.data);
};

export const getAssetIdentities = async (
  uuid: string
): Promise<AssetIdentity[]> => {
  const response = await restInstance.get<DataEnvelope<AssetIdentity[]>>(
    `/assets/${uuid}/identities`,
    { showSuccessMessage: false } as RequestConfig
  );
  return unwrapData(response.data);
};

export const getAssetObservations = async (
  uuid: string,
  page = 1,
  pageSize = 20
): Promise<PaginatedResult<AssetObservation>> => {
  const response = await restInstance.get<PaginatedResult<AssetObservation>>(
    `/assets/${uuid}/observations`,
    {
      params: { page, pageSize },
      showSuccessMessage: false,
    } as RequestConfig
  );
  return response.data;
};

export const getAssetEvents = async (
  uuid: string,
  page = 1,
  pageSize = 30
): Promise<PaginatedResult<AssetEvent>> => {
  const response = await restInstance.get<PaginatedResult<AssetEvent>>(
    `/assets/${uuid}/events`,
    {
      params: { page, pageSize },
      showSuccessMessage: false,
    } as RequestConfig
  );
  return response.data;
};

export const createAssetEvent = async (
  uuid: string,
  input: AssetEventInput
): Promise<{ success: boolean }> => {
  const response = await restInstance.post<DataEnvelope<{ success: boolean }>>(
    `/assets/${uuid}/events`,
    input,
    { showSuccessMessage: false } as RequestConfig
  );
  return unwrapData(response.data);
};

export const getEvents = async (
  params: EventListParams
): Promise<PaginatedResult<AssetEvent>> => {
  const response = await restInstance.get<PaginatedResult<AssetEvent>>("/events", {
    params,
    showSuccessMessage: false,
  } as RequestConfig);
  return response.data;
};

export const getIssueStates = async (): Promise<IssueStates> => {
  const response = await restInstance.get<DataEnvelope<IssueStates>>(
    "/analysis/issue-states",
    { showSuccessMessage: false } as RequestConfig
  );
  return unwrapData(response.data);
};

export const getAnalysisTrends = async (): Promise<AnalysisTrends> => {
  const response = await restInstance.get<DataEnvelope<AnalysisTrends>>(
    "/analysis/trends",
    { showSuccessMessage: false } as RequestConfig
  );
  return unwrapData(response.data);
};

export const getIdentityAudit = async (): Promise<IdentityAudit> => {
  const response = await restInstance.get<{
    data: Omit<IdentityAudit, "pagination">;
    pagination: IdentityAudit["pagination"];
  }>("/analysis/identity-audit", { showSuccessMessage: false } as RequestConfig);
  return { ...response.data.data, pagination: response.data.pagination };
};

export const getDeviceIdentityReconciliation = async (
  page = 1,
  pageSize = 50
): Promise<DeviceIdentityReconciliation> => {
  const response = await restInstance.get<{
    data: Omit<DeviceIdentityReconciliation, "pagination">;
    pagination: DeviceIdentityReconciliation["pagination"];
  }>("/analysis/device-identity-reconciliation", {
    params: { page, pageSize },
    showSuccessMessage: false,
  } as RequestConfig);
  return { ...response.data.data, pagination: response.data.pagination };
};

export const applyDeviceIdentityReconciliation = async (): Promise<DeviceIdentityReconciliationApplyResult> => {
  const response = await restInstance.post<DataEnvelope<DeviceIdentityReconciliationApplyResult>>(
    "/analysis/device-identity-reconciliation",
    { confirm: true },
    { showSuccessMessage: false } as RequestConfig
  );
  return unwrapData(response.data);
};

export const getObservations = async (
  params: ObservationListParams
): Promise<PaginatedResult<AssetObservation>> => {
  const response = await restInstance.get<PaginatedResult<AssetObservation>>(
    "/observations",
    {
      params,
      showSuccessMessage: false,
    } as RequestConfig
  );
  return response.data;
};

export const getSettings = async (): Promise<InventorySettings> => {
  const response = await restInstance.get<DataEnvelope<InventorySettings>>(
    "/settings",
    { showSuccessMessage: false } as RequestConfig
  );
  return unwrapData(response.data);
};

export const updateSettings = async (
  input: Partial<InventorySettings>
): Promise<InventorySettings> => {
  const response = await restInstance.patch<DataEnvelope<InventorySettings>>(
    "/settings",
    input,
    { showSuccessMessage: false } as RequestConfig
  );
  return unwrapData(response.data);
};

export const createPublicQueryPage = async (
  input?: Pick<InventorySettings, "publicQueryPageSlug">
): Promise<CreatedPublicQueryPage> => {
  const response = await restInstance.post<DataEnvelope<CreatedPublicQueryPage>>(
    "/settings/public-query-page",
    input ?? {},
    { showSuccessMessage: false } as RequestConfig
  );
  return unwrapData(response.data);
};

export const createClientToken = async (
  name: string
): Promise<CreatedClientToken> => {
  const response = await restInstance.post<DataEnvelope<CreatedClientToken>>(
    "/client-tokens",
    { name },
    { showSuccessMessage: false } as RequestConfig
  );
  return unwrapData(response.data);
};

export const updateClientToken = async (
  id: string,
  enabled: boolean
): Promise<ClientToken> => {
  const response = await restInstance.patch<DataEnvelope<ClientToken>>(
    `/client-tokens/${id}`,
    { enabled },
    { showSuccessMessage: false } as RequestConfig
  );
  return unwrapData(response.data);
};

export const deleteClientToken = async (id: string): Promise<void> => {
  await restInstance.delete(`/client-tokens/${id}`, {
    showSuccessMessage: false,
  } as RequestConfig);
};

export const restoreBackup = async (
  backup: unknown,
  dryRun = false
): Promise<BackupRestoreResult> => {
  const response = await restInstance.post<DataEnvelope<BackupRestoreResult>>(
    "/backup-restore",
    { backup, dryRun },
    { showSuccessMessage: false } as RequestConfig
  );
  return unwrapData(response.data);
};

export const exportBackup = async (
  sections: BackupExportSection[]
): Promise<BackupExportResult> => {
  const response = await restInstance.get<DataEnvelope<BackupExportResult>>(
    "/backup",
    {
      params: { sections: sections.join(",") },
      showSuccessMessage: false,
    } as RequestConfig
  );
  return unwrapData(response.data);
};
