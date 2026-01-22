import { Node, Edge } from '@xyflow/react';

import { SimulationNodeDatum } from 'd3-force';

interface D3Node extends SimulationNodeDatum {
  id: string;
}

import { forceSimulation, forceLink, forceManyBody, forceCollide, forceX, forceY } from 'd3-force';

export const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const d3Nodes = nodes.map((n) => ({ ...n, x: Math.random() * 400, y: Math.random() * 400 }));

  const d3Links = edges.map((e) => ({ source: e.source, target: e.target }));

  const simulation = forceSimulation(d3Nodes)
    .force(
      'link',
      forceLink(d3Links)
        .id((d) => (d as D3Node).id)
        .distance(250),
    )
    .force('charge', forceManyBody().strength(-2000))
    .force('collision', forceCollide().radius(160))
    .force('x', forceX(400).strength(0.1))
    .force('y', forceY(300).strength(0.1))
    .stop();

  for (let i = 0; i < 300; ++i) {
    simulation.tick();
  }

  return d3Nodes.map((node) => ({
    ...node,
    position: { x: node.x, y: node.y },
  }));
};
