/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import { HttpResponse } from 'msw';
import { mockGetApiClient } from './server';

export const handlers = [
  mockGetApiClient('/account/details', () => {
    return HttpResponse.json({
      data: {
        id: 'account-1',
        type: 'account',
        attributes: {
          username: 'user1',
          email: 'user1@terraform.org',
        },
      },
    });
  }),
  mockGetApiClient('/organizations', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'org-1',
          attributes: {
            'external-id': 'org-1',
            name: 'Org 1',
          },
        },
        {
          id: 'org-2',
          attributes: {
            'external-id': 'org-2',
            name: 'Org 2',
          },
        },
      ],
    });
  }),
  mockGetApiClient('/organization-memberships', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'ou-VgJgfbDVN3APUm2F',
          attributes: {
            status: 'active',
          },
          relationships: {
            organization: {
              data: {
                id: 'org-1',
              },
            },
          },
        },
        {
          id: 'ou-VgJgfbDVN3APUm2Fdf',
          attributes: {
            status: 'active',
          },
          relationships: {
            organization: {
              data: {
                id: 'org-2',
              },
            },
          },
        },
      ],
    });
  }),
  mockGetApiClient('/organizations/:organization_name/projects', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'proj-1',
          attributes: {
            name: 'Project 1',
          },
        },
      ],
      meta: {
        pagination: {
          'current-page': 1,
          'page-size': 20,
          'next-page': null,
          'prev-page': null,
          'total-count': 20,
          'total-pages': 0,
        },
      },
    });
  }),
  mockGetApiClient('/projects/:project_id', () => {
    return HttpResponse.json({
      data: {
        id: 'proj-1',
        attributes: {
          name: 'Project 1',
        },
      },
    });
  }),
  mockGetApiClient('/organizations/:organization_name/workspaces', () => {
    return HttpResponse.json({
      meta: {
        pagination: {
          'current-page': 1,
          'page-size': 20,
          'next-page': null,
          'prev-page': null,
          'total-count': 20,
          'total-pages': 0,
        },
      },
      included: [],
      data: [
        {
          id: 'ws-1',
          attributes: {
            name: 'Workspace 1',
            description: 'Workspace 1 description',
            environment: 'production',
            'execution-mode': 'agent',
            source: 'source',
            'updated-at': new Date('2021-07-01T00:00:00Z'),
            'run-failures': 0,
            'resource-count': 0,
            'terraform-version': '0.12.0',
            locked: false,
            'vcs-repo-identifier': 'vcs-repo-identifier',
            'vcs-repo': {
              'repository-http-url': 'https://foo.com/bar',
            },
            'auto-apply': false,
          },
          relationships: {
            project: {
              data: {
                id: 'proj-1',
                type: 'projects',
              },
            },
            'latest-run': {
              data: {
                id: 'run-1',
                type: 'runs',
              },
            },
          },
          links: {
            self: '/workspaces/ws-1',
            'self-html': '/workspaces/ws-1',
          },
        },
      ],
    });
  }),
  mockGetApiClient('/workspaces/:workspace_id', () => {
    return HttpResponse.json({
      data: {
        id: 'ws-1',
        attributes: {
          name: 'Workspace 1',
          description: 'Workspace 1 description',
          environment: 'production',
          'execution-mode': 'agent',
          source: 'source',
          'updated-at': new Date('2021-07-01T00:00:00Z'),
          'run-failures': 0,
          'resource-count': 0,
          'terraform-version': '0.12.0',
          locked: false,
          'vcs-repo-identifier': 'vcs-repo-identifier',
          'vcs-repo': {
            'repository-http-url': 'https://foo.com/bar',
          },
          'auto-apply': false,
        },
        relationships: {
          project: {
            data: {
              id: 'proj-1',
              type: 'projects',
            },
          },
          'latest-run': {
            data: {
              id: 'run-1',
              type: 'runs',
            },
          },
        },
        links: {
          self: '/workspaces/ws-1',
          'self-html': '/workspaces/ws-1',
        },
      },
    });
  }),

  mockGetApiClient('/workspaces/:workspace_id/runs', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'run-1',
          attributes: {
            'created-at': new Date(Date.UTC(2021, 6, 1, 0, 0, 0)),
            message: 'Run 1',
            source: 'terraform+cloud',
            status: 'planned',
            'trigger-reason': 'manual',
            'terraform-version': '0.12.0',
          },
          relationships: {
            workspace: {
              data: {
                id: 'ws-1',
                type: 'workspaces',
              },
            },
            'configuration-version': {
              data: {
                id: 'cv-1',
                type: 'configuration-versions',
              },
            },
            'created-by': {
              data: {
                id: 'user-1',
                type: 'users',
              },
            },
          },
        },
      ],
      meta: {
        pagination: {
          'current-page': 1,
          'page-size': 20,
          'next-page': null,
          'prev-page': null,
          'total-count': 20,
          'total-pages': 0,
        },
      },
    });
  }),
  mockGetApiClient('/runs/:run_id', () => {
    return HttpResponse.json({
      data: {
        id: 'run-1',
        attributes: {
          'created-at': new Date('2021-07-01T00:00:00Z'),
          message: 'Run 1',
          source: 'terraform+cloud',
          status: 'planned',
          'trigger-reason': 'manual',
          'terraform-version': '0.12.0',
        },
        relationships: {
          plan: {
            data: {
              id: 'plan-1',
              type: 'plans',
            },
          },
          apply: {
            data: {
              id: 'apply-1',
              type: 'applies',
            },
          },
          workspace: {
            data: {
              id: 'ws-1',
              type: 'workspaces',
            },
          },
          'configuration-version': {
            data: {
              id: 'cv-1',
              type: 'configuration-versions',
            },
          },
          'created-by': {
            data: {
              id: 'user-1',
              type: 'users',
            },
          },
        },
      },
    });
  }),
];
