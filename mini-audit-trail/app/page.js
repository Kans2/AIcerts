
"use client"

import { useEffect, useState, useContext, createContext, useMemo } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  Card,
  CardContent,
  Alert,
  Collapse,
  IconButton,
  CssBaseline,
  ThemeProvider,
  createTheme
} from "@mui/material";

// Icons for Dark/Light Mode
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// --- 1. Theme Context & Provider Setup ---

// Create a context to manage the color mode
const ColorModeContext = createContext({ toggleColorMode: () => {} });

// Custom hook to use the context
export const useColorMode = () => useContext(ColorModeContext);

// Function to create MUI theme based on mode
const getAppTheme = (mode) => {
  // Determine background colors based on user's persistent instruction:
  const bodyBgColor = mode === 'dark' ? 'black' : 'white';
  
  return createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            // Light mode specific colors
            background: {
              default: bodyBgColor,
              paper: '#ffffff',
            },
          }
        : {
            // Dark mode specific colors
            background: {
              default: bodyBgColor,
              paper: '#1e1e1e', // Darker background for Cards/surfaces
            },
            text: {
              primary: '#ffffff',
              secondary: '#b3b3b3',
            },
          }),
    },
    // Customize typography, etc., if needed
  });
};

// Theme Provider Component
function ThemeWrapper({ children }) {
  const [mode, setMode] = useState('light'); // Default to light

  // 1. Theme Toggler Logic
  const colorMode = useMemo(() => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  // 2. Create the theme object based on the current mode
  const theme = useMemo(() => getAppTheme(mode), [mode]);

  // 3. User Instruction Implementation (Set body background)
  useEffect(() => {
    // Applying the persistent user instruction for theme change:
    const bgColor = theme.palette.mode === 'dark' ? 'black' : 'white';
    document.body.style.backgroundColor = bgColor;
  }, [theme.palette.mode]);


  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        {/* CssBaseline provides a clean slate and handles background color */}
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

// --- 2. Component Logic and UI ---

// Custom component to handle the collapsible content display
function VersionDetails({ v }) {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const renderWordList = (words) => (
    words.length ? words.join(", ") : <Typography component="span" color="text.secondary">—</Typography>
  );
  
  const addedCount = v.addedWords.length;
  const removedCount = v.removedWords.length;

  return (
    <Card sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }} variant="outlined">
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* Header/Summary Line */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {new Date(v.timestamp).toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total words: {v.newWordCount} | Total chars: {v.newLength}
          </Typography>
        </Box>

        {/* Added/Removed words (with explicit counts) */}
        <Box sx={{ mt: 1, fontSize: 13 }}>
          <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
            <Box component="strong" sx={{ color: 'success.main' }}>Added ({addedCount}):</Box> {renderWordList(v.addedWords)}
          </Typography>
          <Typography variant="body2" sx={{ lineHeight: 1.4, mt: 0.5 }}>
            <Box component="strong" sx={{ color: 'error.main' }}>Removed ({removedCount}):</Box> {renderWordList(v.removedWords)}
          </Typography>
        </Box>

        {/* View Content (Collapsible) */}
        <Button 
          size="small" 
          onClick={handleToggle} 
          sx={{ mt: 1, p: 0.5 }}
          startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          {expanded ? "Hide content" : "View content"}
        </Button>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box 
            component="pre" 
            sx={{ 
              whiteSpace: "pre-wrap", 
              fontSize: 12, 
              background: 'background.default', // Use theme background color
              padding: 1, 
              borderRadius: 1, 
              mt: 1,
              border: '1px solid', 
              borderColor: 'divider',
            }}
          >
            {v.content}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}


function HomePageContent() {
  const [text, setText] = useState("");
  const [versions, setVersions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  
  const { toggleColorMode } = useColorMode(); // Access the toggle function

  // Determine message type for Alert component
  const getMessageType = (msg) => {
    if (msg.startsWith("Error")) return "error";
    if (msg.startsWith("Saved")) return "success";
    return "info";
  };

  async function fetchVersions() {
    try {
      const r = await fetch("/api/versions");
      const j = await r.json();
      setVersions(j.versions || []);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchVersions();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const r = await fetch("/api/save-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Save failed");
      setMessage("Saved ✓");
      setText(j.version.content); // reflect persisted content
      await fetchVersions();
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "An unknown error occurred.";
      console.error(e);
      setMessage("Error saving: " + errorMsg);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 2500);
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Theme Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3" component="h1">
          Mini Audit Trail Generator
        </Typography>
        {/* Theme Toggle Button */}
        <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
          {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>
      
      <Typography variant="body1" paragraph>
        Type some content below. Click **Save Version** to record a version and generate the audit trail.
      </Typography>

      <Box sx={{ display: "flex", gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        {/* Content Editor Panel */}
        <Box sx={{ flex: 1, minWidth: { xs: '100%', md: '50%' } }}>
          <Typography variant="h6" component="label" htmlFor="content-editor" sx={{ mb: 1, display: "block" }}>
            Content Editor
          </Typography>
          <TextField
            id="content-editor"
            value={text}
            onChange={(e) => setText(e.target.value)}
            multiline
            rows={14}
            fullWidth
            variant="outlined"
            placeholder="Start typing here..."
            sx={{ '& .MuiInputBase-input': { p: 1.5 } }}
          />
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="contained"
              color="primary"
              size="large"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {saving ? "Saving..." : "Save Version"}
            </Button>
            {message && (
              <Alert severity={getMessageType(message)} sx={{ ml: 2, py: 0, '& .MuiAlert-message': { py: 0.5 } }}>
                {message}
              </Alert>
            )}
          </Box>
        </Box>

        {/* Version History Panel */}
        <Box sx={{ width: { xs: '100%', md: 420 }, minWidth: { xs: '100%', md: 420 } }}>
          <Typography variant="h6" component="label" sx={{ mb: 1, display: "block" }}>
            Version History
          </Typography>
          <Box
            sx={{
              maxHeight: 520, 
              overflowY: "auto",
              border: "1px solid",
              borderColor: 'divider',
              borderRadius: 1,
              p: 1,
              bgcolor: 'background.paper'
            }}
          >
            {versions.length === 0 ? (
              <Typography color="text.secondary" sx={{ p: 1 }}>
                No versions saved yet.
              </Typography>
            ) : (
              <List disablePadding>
                {versions.map((v) => (
                  <ListItem key={v.id} disablePadding sx={{ display: 'block' }}>
                    <VersionDetails v={v} />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ mt: 3, color: 'text.secondary', fontSize: 13 }}>
        <Typography variant="caption" display="block">
          Saved versions are kept in <code>/data/versions.json</code>
        </Typography>
      </Box>
    </Container>
  );
}

// Default export uses the wrapper to apply the theme
export default function Home() {
    return (
        <ThemeWrapper>
            <HomePageContent />
        </ThemeWrapper>
    );
}

// Get access to the theme (needed for the IconButton inside HomePageContent)
// This is a common pattern when context is defined outside the main component file.
// Since we are combining them here, we need to ensure the theme is accessible.
const theme = getAppTheme('light'); // Initial theme for the Icon check (will be overwritten by the state)





// "use client"
// import { useEffect, useState } from "react";

// export default function Home() {
//   const [text, setText] = useState("");
//   const [versions, setVersions] = useState([]);
//   const [saving, setSaving] = useState(false);
//   const [message, setMessage] = useState("");

//   async function fetchVersions() {
//     try {
//       const r = await fetch("/api/versions");
//       const j = await r.json();
//       setVersions(j.versions || []);
//     } catch (e) {
//       console.error(e);
//     }
//   }

//   useEffect(() => {
//     fetchVersions();
//   }, []);

//   async function handleSave() {
//     setSaving(true);
//     setMessage("");
//     try {
//       const r = await fetch("/api/save-version", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ content: text })
//       });
//       const j = await r.json();
//       if (!r.ok) throw new Error(j.error || "Save failed");
//       setMessage("Saved ✓");
//       setText(j.version.content); // reflect persisted content
//       await fetchVersions();
//     } catch (e) {
//       console.error(e);
//       setMessage("Error saving: " + e.message);
//     } finally {
//       setSaving(false);
//       setTimeout(() => setMessage(""), 2500);
//     }
//   }

//   return (
//     <div style={{ fontFamily: "Inter, system-ui, sans-serif", padding: 20, maxWidth: 1000, margin: "0 auto" }}>
//       <h1>Mini Audit Trail Generator</h1>
//       <p>Type some content below. Click <strong>Save Version</strong> to record a version and generate the audit trail.</p>

//       <div style={{ display: "flex", gap: 20 }}>
//         <div style={{ flex: 1 }}>
//           <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Content Editor</label>
//           <textarea
//             value={text}
//             onChange={(e) => setText(e.target.value)}
//             rows={14}
//             style={{ width: "100%", padding: 12, fontSize: 14, borderRadius: 8 }}
//           />
//           <div style={{ marginTop: 12 }}>
//             <button onClick={handleSave} disabled={saving} style={{ padding: "10px 16px", borderRadius: 8 }}>
//               {saving ? "Saving..." : "Save Version"}
//             </button>
//             <span style={{ marginLeft: 12 }}>{message}</span>
//           </div>
//         </div>

//         <div style={{ width: 420 }}>
//           <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Version History</label>
//           <div style={{ maxHeight: 420, overflow: "auto", border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
//             {versions.length === 0 && <div style={{ color: "#666" }}>No versions saved yet.</div>}
//             {versions.map((v) => (
//               <div key={v.id} style={{ borderBottom: "1px solid #f2f2f2", padding: "10px 6px" }}>
//                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
//                   <div style={{ fontWeight: 700 }}>{new Date(v.timestamp).toLocaleString()}</div>
//                   <div style={{ fontSize: 12, color: "#666" }}>words: {v.newWordCount} | chars: {v.newLength}</div>
//                 </div>

//                 <div style={{ marginTop: 6, fontSize: 13 }}>
//                   <div><strong>Added:</strong> {v.addedWords.length ? v.addedWords.join(", ") : <span style={{ color: "#888" }}>—</span>}</div>
//                   <div style={{ marginTop: 4 }}><strong>Removed:</strong> {v.removedWords.length ? v.removedWords.join(", ") : <span style={{ color: "#888" }}>—</span>}</div>
//                 </div>

//                 <details style={{ marginTop: 8 }}>
//                   <summary style={{ cursor: "pointer" }}>View content</summary>
//                   <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "#fafafa", padding: 8, borderRadius: 6 }}>{v.content}</pre>
//                 </details>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       <footer style={{ marginTop: 18, color: "#666", fontSize: 13 }}>
//         <div>Saved versions are kept in <code>/data/versions.json</code></div>
//       </footer>
//     </div>
//   );
// }
