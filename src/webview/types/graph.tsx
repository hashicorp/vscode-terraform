export interface TerraformResource {
    id: number;
    type: string;
    labels: string[] | null;
    uri: string;
    range: {
        start: { line: number; character: number };
        end: { line: number; character: number };
    };
}

export interface TerraformEdge {
    from: number;
    to: number;
}


export interface GraphData {
    nodes: TerraformResource[];
    edges: TerraformEdge[];
}
