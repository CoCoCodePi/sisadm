import { CssBaseline, ThemeProvider } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { BrowserRouter } from "react-router-dom";
import DateProvider from "./providers/DateProvider";
import theme from "./styles/theme";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./contexts/AuthContext";
import PersistedLocationProvider from "./components/PersistedLocationProvider";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3}>
          <AuthProvider>
            <DateProvider>
              <PersistedLocationProvider>
                <AppRoutes />
              </PersistedLocationProvider>
            </DateProvider>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
