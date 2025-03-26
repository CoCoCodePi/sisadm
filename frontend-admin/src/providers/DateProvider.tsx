// src/providers/DateProvider.tsx
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";

const DateProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={es} // Opcional: Configura el idioma
    >
      {children}
    </LocalizationProvider>
  );
};

export default DateProvider;
