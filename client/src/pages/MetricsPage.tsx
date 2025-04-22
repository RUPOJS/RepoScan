import * as React from "react";
import { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import api from "../services/api";

/**
 * Simple flexbox layout:
 * ┌───────┬─────────────────────────┐
 * │ card  │  bar‑chart              │
 * │ (25%) │  (75%)                  │
 * └───────┴─────────────────────────┘
 */
export default function MetricsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/api/repo/metrics").then((r) => setData(r.data));
  }, []);

  if (!data) return <>Loading…</>;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        alignItems: "stretch",
      }}
    >
      {/* left card */}
      <div style={{ flex: "1 1 240px", maxWidth: 300 }}>
        <Card sx={{ height: "100%" }}>
          <CardContent>
            <Typography variant="h6">Avg Complexity</Typography>
            <Typography variant="h3">{data.avgComplex}</Typography>
          </CardContent>
        </Card>
      </div>

      {/* right chart */}
      <div style={{ flex: "3 1 450px", minWidth: 300 }}>
        <BarChart width={600} height={300} data={data.topSmells}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" />
        </BarChart>
      </div>
    </div>
  );
}
