/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { PluginId, Zodios, ZodiosEndpointDefinition, ZodiosInstance, ZodiosPlugin } from "@zodios/core";
import { pluginHeader, pluginToken } from "@zodios/plugins";
import { accountEndpoints } from "../../terraformCloud/account";
import { organizationEndpoints } from "../../terraformCloud/organization";
import { projectEndpoints } from "../../terraformCloud/project";
import { workspaceEndpoints } from "../../terraformCloud/workspace";
import { applyEndpoints } from "../../terraformCloud/apply";
import { configurationVersionEndpoints } from "../../terraformCloud/configurationVersion";
import { ingressAttributesEndpoints } from "../../terraformCloud/ingressAttribute";
import { planEndpoints } from "../../terraformCloud/plan";
import { runEndpoints } from "../../terraformCloud/run";
import { userEndpoints } from "../../terraformCloud/user";
import * as vscode from 'vscode';

export class TerraformCloudApiProvider{
  public static readonly defaultHostname = 'app.terraform.io';
  private static readonly jsonHeader: ZodiosPlugin = pluginHeader('Content-Type', async () => 'application/vnd.api+json');
  private static readonly pluginLogger = function():ZodiosPlugin{
    return{
      response: async (_api, _config, response) => {
        console.log(response);
        return response;
      },
    }
  }

  userAgentHeader: ZodiosPlugin;

  earlyApiClient;
  apiClient;
  tokenPluginId!: PluginId;

  constructor(
    private hostname: string,
    extVersion: string,
    authSession: vscode.AuthenticationSession|undefined
  ){

    this.userAgentHeader = pluginHeader('User-Agent',
      async () => `VSCode/${vscode.version} hashicorp.terraform/${extVersion}`,
    );

    this.earlyApiClient = this.createEarlyApiClient(hostname);
    this.apiClient = this.createApiClient(hostname);
    this.changeAuthSession(authSession);
  }

  public changeSession(newHostname: string){
    this.hostname = newHostname;
    this.earlyApiClient = this.createEarlyApiClient(this.hostname);
    this.apiClient = this.createApiClient(this.hostname);
  }

  public changeAuthSession(newAuthSession: vscode.AuthenticationSession | undefined){
    if (this.tokenPluginId){
      this.apiClient.eject(this.tokenPluginId);
    }
    this.tokenPluginId = this.apiClient.use(
      pluginToken({
        getToken: async () => {
          return newAuthSession?.accessToken;
        },
      }),
    );
  }

  public static TerraformCloudAPIUrl(TerraformCloudHost: string){
    return `https://${TerraformCloudHost}/api/v2`
  };
  public static TerraformCloudWebUrl(TerraformCloudHost: string){
    return `https://${TerraformCloudHost}/app`
  };

  public TerraformCloudAPIUrl(){
    return TerraformCloudApiProvider.TerraformCloudAPIUrl(this.hostname);
  }
  public TerraformCloudWebUrl(){
    return TerraformCloudApiProvider.TerraformCloudWebUrl(this.hostname);
  }

  private setupZodiosClientPlugins(client:any){
    client.use(TerraformCloudApiProvider.jsonHeader);
    client.use(this.userAgentHeader);
    client.use(TerraformCloudApiProvider.pluginLogger());
  }

  private createEarlyApiClient(hostname:string){
    let client = new Zodios(TerraformCloudApiProvider.TerraformCloudAPIUrl(hostname), accountEndpoints);
    this.setupZodiosClientPlugins(client);
    return client;
  }
  private createApiClient(hostname:string){
    let client = new Zodios(TerraformCloudApiProvider.TerraformCloudAPIUrl(this.hostname), [
      ...accountEndpoints,
      ...organizationEndpoints,
      ...projectEndpoints,
      ...workspaceEndpoints,
      ...runEndpoints,
      ...planEndpoints,
      ...applyEndpoints,
      ...userEndpoints,
      ...configurationVersionEndpoints,
      ...ingressAttributesEndpoints,
    ]);
    this.setupZodiosClientPlugins(client);
    return client;
  }

}
