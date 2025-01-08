// Copyright (c) The OpenTofu Authors
// SPDX-License-Identifier: MPL-2.0
// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: MPL-2.0

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
