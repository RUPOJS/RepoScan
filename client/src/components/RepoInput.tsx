import { Button, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import api from "../services/api";

export default function RepoInput() {
  const [repoUrl, setRepoUrl] = useState("");
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState("");

  const handle = async () => {
    const { data } = await api.post("/api/repo", { repoUrl, token });
    setMsg(data.message);
  };

  return (
    <Stack spacing={2} maxWidth={500}>
      <Typography variant="h5">Index a Repository</Typography>
      <TextField
        label="Repo URL"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        fullWidth
      />
      <TextField
        label="Token (optional)"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        type="password"
        fullWidth
      />
      <Button variant="contained" onClick={handle}>
        Index
      </Button>
      {msg && <Typography color="green">{msg}</Typography>}
    </Stack>
  );
}
