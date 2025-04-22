import { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  Typography,
  CircularProgress,
  Stack,
  InputAdornment,
  IconButton,
  Button,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PauseIcon from "@mui/icons-material/Pause";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CSSProperties } from "react";

interface Message {
  type: "user" | "bot";
  text: string;
  sources?: { filePath: string; complexity: string }[];
}

export default function ChatUI() {
  const [question, setQuestion] = useState("");
  const [regex, setRegex] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [controller, setController] = useState<EventSource | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  const stopStreaming = () => {
    controller?.close();
    setController(null);
    setLoading(false);
  };

  const ask = () => {
    if (!question.trim() || loading) return;

    const userMsg: Message = { type: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);

    const botMsg: Message = { type: "bot", text: "" };
    setMessages((prev) => [...prev, botMsg]);

    const source = new EventSource(
      `/api/chat/ask/stream?question=${encodeURIComponent(
        question
      )}&regex=${encodeURIComponent(regex)}`
    );

    setController(source);

    let fullText = "";
    let finalSources: Message["sources"] = [];

    source.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "token") process.stdout.write(data.text);
      if (data.type === "sources") console.log("\n\n🔍 Sources:", data.sources);

      if (event.data === "[DONE]") {
        stopStreaming();
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, sources: finalSources }];
        });
        return;
      }

      try {
        const chunk = JSON.parse(event.data);

        if (chunk.type === "token") {
          fullText += chunk.text;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, text: fullText }];
          });
        }

        if (chunk.type === "sources") {
          finalSources = chunk.sources;
        }

        scrollToBottom();
      } catch (err) {
        console.error("Stream parse error:", err);
      }
    };

    source.onerror = () => {
      console.error("Stream connection failed");
      stopStreaming();
    };
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      {/* Message Container */}
      <Box
        ref={containerRef}
        flex={1}
        overflow="auto"
        px={4}
        py={2}
        bgcolor="#0d1117"
        color="white"
      >
        {messages.map((msg, i) => (
          <Box key={i} mb={3}>
            <Typography
              variant="subtitle2"
              sx={{ color: msg.type === "user" ? "#58a6ff" : "#8b949e" }}
            >
              {msg.type === "user" ? "You" : "RepoScan AI"}
            </Typography>

            <ReactMarkdown
              children={msg.text}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={oneDark as { [key: string]: CSSProperties }}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code
                      style={{
                        backgroundColor: "#161b22",
                        padding: "2px 4px",
                        borderRadius: 4,
                      }}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            />

            {msg.sources?.length && (
              <Box mt={1}>
                <Typography variant="caption" sx={{ color: "#8b949e" }}>
                  Sources:
                </Typography>
                {msg.sources.map((s, idx) => (
                  <Typography
                    key={idx}
                    variant="caption"
                    sx={{ display: "block", color: "#c9d1d9" }}
                  >
                    • {s.filePath} (complexity {s.complexity})
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {/* Input Bar */}
      <Box px={4} py={2} bgcolor="#161b22" borderTop="1px solid #30363d">
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask something about the repo..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={ask} disabled={loading}>
                    {loading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <SendIcon sx={{ color: "#58a6ff" }} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
              sx: { input: { color: "white" } },
            }}
            sx={{ bgcolor: "#0d1117", input: { color: "white" } }}
          />

          <TextField
            label="Regex"
            value={regex}
            onChange={(e) => setRegex(e.target.value)}
            sx={{ minWidth: 200 }}
            InputProps={{ sx: { input: { color: "white" } } }}
            InputLabelProps={{ sx: { color: "white" } }}
          />

          {loading && (
            <Button
              variant="outlined"
              onClick={stopStreaming}
              startIcon={<PauseIcon />}
              sx={{ color: "#58a6ff", borderColor: "#30363d" }}
            >
              Pause
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
