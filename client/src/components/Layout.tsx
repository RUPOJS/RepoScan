import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar } from "@mui/material";
import { Inbox, Chat, BarChart, Hub } from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import React from "react";

const menu = [
  { label: "Index Repo", icon: <Inbox />, to: "/" },
  { label: "Chat", icon: <Chat />, to: "/chat" },
  { label: "Metrics", icon: <BarChart />, to: "/metrics" },
  { label: "Graph", icon: <Hub />, to: "/graph" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return (
    <>
      <Drawer variant="permanent">
        <Toolbar />
        <List sx={{ width: 200 }}>
          {menu.map(({ label, icon, to }) => (
            <ListItemButton
              key={label}
              component={Link}
              to={to}
              selected={loc.pathname === to}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <main style={{ marginLeft: 200, padding: 24, minHeight: "100vh" }}>
        {children}
      </main>
    </>
  );
}
