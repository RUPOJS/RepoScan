import ReactFlow, { Background } from "react-flow-renderer"; // or "reactflow" if on latest
import { useEffect, useState } from "react";
import api from "../services/api";

export default function GraphPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);

  useEffect(() => {
    api.get("/api/graph").then(({ data }) => {
      const n: any[] = [];
      const e: any[] = [];
      Object.entries<any>(data).forEach(([src, deps]) => {
        n.push({ id: src, data: { label: src }, position: { x: 0, y: 0 } });
        deps.forEach((t: string) =>
          e.push({ id: `${src}-${t}`, source: src, target: t })
        );
      });
      setNodes(n);
      setEdges(e);
    });
  }, []);

  return (
    <div style={{ height: 600 }}>
      <ReactFlow nodes={nodes} edges={edges}>
        <Background />
      </ReactFlow>
    </div>
  );
}
