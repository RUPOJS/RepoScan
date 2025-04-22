import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import RepoPage from "./pages/RepoPage";
import ChatPage from "./pages/ChatPage";
import MetricsPage from "./pages/MetricsPage";
import GraphPage from "./pages/GraphPage";

const theme = createTheme({
  palette: { mode: "light", primary: { main: "#1976d2" } },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/metrics" element={<MetricsPage />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/" element={<RepoPage />} />   {/* keep last */}
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}
