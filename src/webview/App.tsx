import React, { useEffect, useState, useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    MarkerType
} from '@xyflow/react';

// Mandatory: This must be imported for the graph to be visible
import '@xyflow/react/dist/style.css';


import { GraphData , TerraformResource } from "./types/graph"
import { TYPE_COLORS } from './constants/graphSettings';

import "./constants/graphSettings"

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

    useEffect(() => {
    const handler = (event: MessageEvent<VsCodeMessage>) => {
        const message = event.data;

        if (message.command === 'setData') {
            const { nodes: tfNodes, edges: tfEdges } = message.data;

            const rfNodes: Node[] = tfNodes.map((n, i) => ({
                id: String(n.id),
                data: {
                    type: n.type,
                    label: (
                        <div style={{ padding: '2px 4px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 'bold', opacity: 0.7, textTransform: 'uppercase' }}>
                                {n.type}
                            </div>
                            <div style={{ fontSize: '12px', marginTop: '2px' }}>
                                {n.labels?.join('.') ?? 'root'}
                            </div>
                        </div>
                    ),
                    meta: n
                },
                position: { x: (i % 4) * 280, y: Math.floor(i / 4) * 180 },
                className: 'terraform-node',
                style: {
                    borderLeft: `5px solid ${TYPE_COLORS[n.type] || '#ccc'}`,
                }
            }));

            const rfEdges: Edge[] = tfEdges.map((e, i) => ({
                id: `e-${String(e.from)}-${String(e.to)}-${String(i)}`,
                // Source and Target MUST be strings for React Flow to connect them
                source: String(e.from),
                target: String(e.to),
                type: 'straight',
                animated: false,
                style: { stroke: '#000000ff', strokeWidth: 1 },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#475569',
                },
            }));

            setNodes(rfNodes);
            setEdges(rfEdges);
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

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const handleJumpToCode = () => {
        if (selectedNode && vscode) {
            const meta = selectedNode.data.meta as TerraformResource;
            vscode.postMessage({
                command: 'goToCode',
                filePath: meta.uri,
                line: meta.range.start.line
            });
        }
    };

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', backgroundColor: '#f0f0f0' }}>
            {/* The Graph Container */}
            <div style={{ flexGrow: 1, height: '100%', position: 'relative' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onlyRenderVisibleElements={true}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    fitView
                >
                    <Background color="#ccc" gap={20} />
                    <Controls />
                </ReactFlow>

                {nodes.length === 0 && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#888' }}>
                        Waiting for Terraform data...
                    </div>
                )}
            </div>

            {/* The Sidebar */}
            {selectedNode && (
                <div style={{
                    width: 350,
                    background: '#252526',
                    color: '#cccccc',
                    padding: '20px',
                    borderLeft: '1px solid #444',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    boxShadow: '-2px 0 10px rgba(0,0,0,0.5)'
                }}>
                    <h2 style={{ color: '#ffffff', margin: 0, fontSize: '1.1rem' }}>Resource Details</h2>
                    <hr style={{ width: '100%', borderColor: '#444' }} />

                    <div>
                        <small style={{ color: '#888' }}>RESOURCE ID</small>
                        <div style={{ wordBreak: 'break-all', marginTop: '4px' }}>{selectedNode.id}</div>
                    </div>

                    <div>
                        <small style={{ color: '#888' }}>TYPE</small>
                        <div style={{ marginTop: '4px' }}>{selectedNode.data.type as string}</div>
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                        <button
                            onClick={handleJumpToCode}
                            style={{
                                background: '#007acc',
                                color: 'white',
                                border: 'none',
                                padding: '10px',
                                cursor: 'pointer',
                                width: '100%',
                                borderRadius: '2px',
                                marginBottom: '10px'
                            }}
                        >
                            Go to Code
                        </button>
                        <button
                            onClick={() => { setSelectedNode(null); }}
                            style={{
                                width: '100%',
                                background: 'transparent',
                                color: '#ccc',
                                border: '1px solid #444',
                                padding: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            Close Panel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
