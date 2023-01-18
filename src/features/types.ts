/**
 * Defines our experimental capabilities provided by the client.
 */
export interface ExperimentalClientCapabilities {
  experimental: {
    telemetryVersion?: number;
    showReferencesCommandId?: string;
    refreshModuleProvidersCommandId?: string;
    refreshModuleCallsCommandId?: string;
    refreshTerraformVersionCommandId?: string;
  };
}
