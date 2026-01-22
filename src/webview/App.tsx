import React, { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
  MiniMap,
  BackgroundVariant
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { getLayoutedElements } from './layout';
import { GraphData, TerraformResource } from "./types/graph";
import { TYPE_COLORS } from './constants/graphSettings';
import { tracer } from './tracer';

import './css/App.css';
import "./constants/graphSettings";


interface VsCodeMessage {
  command: string;
  data: GraphData;
}

interface WebviewState {
  selectedNodeId?: string;
}

interface VsCodeApi {
  postMessage(message: { command: string; [key: string]: unknown }): void;
  getState(): WebviewState | undefined;
  setState(state: WebviewState): void;
}

declare global {
  function acquireVsCodeApi(): VsCodeApi;
}

const vscode = typeof acquireVsCodeApi === 'function'
  ? (acquireVsCodeApi() as unknown as VsCodeApi)
  : null;


export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    const container = document.querySelector('.react-flow__renderer');
    container?.classList.add('highlighting');

    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.source === node.id || edge.target === node.id) {
          return { ...edge, className: 'connected-to-hovered', animated: true };
        }
        return edge;
      })
    );
  }, [setEdges]);

  const onNodeMouseLeave = useCallback(() => {
    const container = document.querySelector('.react-flow__renderer');
    container?.classList.remove('highlighting');

    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.className === 'connected-to-hovered') {
          return { ...edge, className: '', animated: false };
        }
        return edge;
      })
    );
  }, [setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleJumpToCode = () => {
    if (selectedNode && vscode) {
      const meta = selectedNode.data.meta as TerraformResource;
      const cleanPath = new URL(meta.uri).pathname;
      vscode.postMessage({
        command: 'goToCode',
        filePath: cleanPath,
        line: meta.range.start.line
      });
    }
  };

  useEffect(() => {
    const handler = (event: MessageEvent<VsCodeMessage>) => {
      const message = event.data;

      if (message.command === 'setData') {
        const rootSpan = tracer.startSpan('webview_receive_data');
        const { nodes: tfNodes, edges: tfEdges } = message.data;
        rootSpan.setAttribute('node.count', tfNodes.length);
        rootSpan.setAttribute('edge.count', tfEdges.length);

        const nodeMappingSpan = tracer.startSpan('map_tf_to_rf_nodes');
        const rfNodes: Node[] = tfNodes.map((n) => ({
          id: String(n.id),
          data: {
            type: n.type,
            label: (
              <div className="node-container">
                <div className="node-header">
                  <span className="node-type">{n.type.split('_').pop()}</span>
                </div>
                <div className="node-label">
                  {n.labels?.join('.') ?? 'root'}
                </div>
              </div>
            ),
            meta: n
          },
          position: { x: 0, y: 0 },
          className: 'terraform-node',
          style: {
            borderLeft: `5px solid ${TYPE_COLORS[n.type] || '#ccc'}`,
          }
        }));
        nodeMappingSpan.end();

        const edgeMappingSpan = tracer.startSpan('map_tf_to_rf_edges');
        const rfEdges: Edge[] = tfEdges.map((e, i) => ({
          id: `e-${String(e.from)}-${String(e.to)}-${String(i)}`,
          source: String(e.from),
          target: String(e.to),
          type: 'straight',
          animated: false,
          pathOptions: {
            borderRadius: 40,
            offset: 25
          },
          style: {
            strokeWidth: 1.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#94a3b8',
          },
        }));

        const layoutedNodes = getLayoutedElements(rfNodes, rfEdges);
        edgeMappingSpan.end();

        const renderSpan = tracer.startSpan('react_flow_render_and_paint');
        setNodes(layoutedNodes);
        setEdges(rfEdges);

        window.requestAnimationFrame(() => {
          renderSpan.end();
          rootSpan.end();
          setIsLoading(false);
        });
      }
    };

    globalThis.addEventListener('message', handler as EventListener);

    if (vscode) {
      vscode.postMessage({ command: 'ready' });
    }

    return () => {
      globalThis.removeEventListener('message', handler as EventListener);
    };
  }, [setNodes, setEdges]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', backgroundColor: '#f0f0f0' }}>

      <div style={{ flexGrow: 1, height: '100%', position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          minZoom={0.2}
          maxZoom={1}
          onlyRenderVisibleElements={true}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          fitView
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={25}
            size={1.5}
            color="#cbd5e1"
          />
          <MiniMap
            style={{
              backgroundColor: '#1e1e1e',
              borderRadius: '8px',
              border: '1px solid #333',
            }}
            nodeColor={(n: Node) => {
              const type = n.data.type as string;
              return TYPE_COLORS[type] || '#555';
            }}
            nodeStrokeColor={(n: Node) => {
              const type = n.data.type as string;
              return TYPE_COLORS[type] || '#777';
            }}
            nodeBorderRadius={4}
            maskColor="rgba(255, 255, 255, 0.08)"
            maskStrokeColor="#007acc"
            maskStrokeWidth={2}
            pannable
            zoomable
          />
          <Controls />
        </ReactFlow>
          {(isLoading || nodes.length === 0) && (
    <div className="loader-overlay">
      <div className="spinner"></div>
      <p>Processing Terraform Graph...</p>
    </div>
  )}
      </div>

      {/* Sidebar Details */}
      {selectedNode && (
        <div className="sidebar-container">
          <div className="sidebar-header">
            <div className="header-title-row">
              <div className="resource-icon-badge">
                {String(selectedNode.data.type).split('_').pop()?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="sidebar-title">Resource Details</h2>
                <span className="sidebar-subtitle">Infrastructure Object</span>
              </div>
            </div>
            <button className="close-icon-btn" onClick={() => { setSelectedNode(null); }}>×</button>
          </div>

          <div className="sidebar-content">
            <div className="info-group">
              <label>Resource ID</label>
              <div className="id-value-container">
                <div className="id-value">{selectedNode.id}</div>
              </div>
            </div>

            <div className="info-group">
              <label>Resource Type</label>
              <div className="type-badge">
                {selectedNode.data.type as string}
              </div>
            </div>
          </div>

          <div className="sidebar-footer">
            <button className="btn-primary" onClick={handleJumpToCode}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
              View Source Code
            </button>
            <button className="btn-secondary" onClick={() => { setSelectedNode(null); }}>
              Close Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
