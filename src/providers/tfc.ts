/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import axios from 'axios';
import { config } from '../utils/vscode';

export async function getUser(token: string): Promise<UserResponse> {
  try {
    const url = config('terraform').get<boolean>('cloud.hostname');
    // 👇️ const data: GetUsersResponse
    const { data, status } = await axios.get<UserResponse>(`https://${url}/api/v2/account/details`, {
      headers: {
        authorization: `Bearer ${token}`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/vnd.api+json',
      },
    });

    // console.log(JSON.stringify(data, null, 4));

    // 👇️ "response status is: 200"
    console.log('response status is: ', status);

    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log('error message: ', error.message);
      // return error.message;
      throw error;
    } else {
      console.log('unexpected error: ', error);
      throw error;
    }
  }
}

export interface UserResponse {
  data: Data;
}

export interface Data {
  id: string;
  type: string;
  attributes: Attributes;
  relationships: Relationships;
  links: Links2;
}

export interface Attributes {
  username: string;
  'is-service-account': boolean;
  'avatar-url': string;
  'v2-only': boolean;
  'is-site-admin': boolean;
  'is-sso-login': boolean;
  email: string;
  'unconfirmed-email': any;
  permissions: Permissions;
}

export interface Permissions {
  'can-create-organizations': boolean;
  'can-change-email': boolean;
  'can-change-username': boolean;
}

export interface Relationships {
  'authentication-tokens': AuthenticationTokens;
}

export interface AuthenticationTokens {
  links: Links;
}

export interface Links {
  related: string;
}

export interface Links2 {
  self: string;
}
