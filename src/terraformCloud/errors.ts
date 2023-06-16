/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { makeErrors } from '@zodios/core';
import { z } from 'zod';

const apiError = z.object({
  status: z.string(),
  title: z.string(),
  detail: z.string().nullish(),
});
export type ApiError = z.infer<typeof apiError>;

export function apiErrorsToString(errors: ApiError[]): string {
  if (errors.length === 1) {
    return singleApiErrorToString(errors[0]);
  }

  let message = `${errors.length} errors occured: `;
  for (let i = 0; i < errors.length; i++) {
    if (i > 0) {
      message += ', ';
    }
    message += `${errors[i].status}: ${errors[i].title}`;
  }

  return message;
}

function singleApiErrorToString(error: ApiError): string {
  let message = `${error.status}: ${error.title}`;
  if (error.detail) {
    message += ` - ${error.detail}`;
  }
  return message;
}

const errorResponse = z.object({
  errors: z.array(apiError),
});

export const errors = makeErrors([
  {
    status: 'default',
    schema: errorResponse,
  },
]);
