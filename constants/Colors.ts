// D:\Developer\PersonAI-App\constants\Colors.ts

// Define the Light Theme colors as per app.json
const lightThemeColors = {
  backgroundPaper: "#F3E9D7",
  backgroundPaperSecondary: "#F8F1E3",
  brandPrimaryGreen: "#1B4D1B",
  brandSecondaryGreen: "#4CAF50",
  tealAccent: "#2F9E9E",
  textPrimary: "#123122",
  textSecondary: "#486356",
  tabBarBackground: "#102017", // Note: app.json specifies dark for tab bar even in light theme often
  tabBarInactive: "#C3D2C3",
  tabBarActive: "#8FE388",
  buttonBackground: "#1B4D1B",
  buttonText: "#FFFFFF",
  chatUserBubble: "#1B4D1B",
  chatAssistantBubble: "#FFFFFF",
  chatInputBackground: "#E7F0C4",
  borderSubtle: "#D5DEC7",
};

// Define the Dark Theme colors as per app.json
const darkThemeColors = {
  backgroundForest: "#050C08",
  backgroundForestSecondary: "#08140C",
  brandPrimaryGreen: "#8FE388",
  brandSecondaryGreen: "#66C17A",
  tealAccent: "#61D0C2",
  textPrimary: "#ECF5E8",
  textSecondary: "#A9C0AA",
  tabBarBackground: "#020604",
  tabBarInactive: "#5B6E60",
  tabBarActive: "#C2F3A8",
  buttonBackground: "#8FE388",
  buttonText: "#021006",
  chatUserBubble: "#8FE388",
  chatAssistantBubble: "#08140C",
  chatInputBackground: "#050C08",
  borderSubtle: "#314236",
};

// Export both themes, and a default 'Colors' object for convenience
export const lightTheme = lightThemeColors;
export const darkTheme = darkThemeColors;

// You can also export a default 'Colors' object that might switch based on a theme context later
// For now, let's assume `Colors.light` and `Colors.dark` are used or directly import `lightTheme`/`darkTheme`
export const Colors = {
  light: lightThemeColors,
  dark: darkThemeColors,
};

// Note: The `ChatScreen` currently imports `Colors.light.softGreen` etc.
// We will need to update the `ChatScreen`'s styles to use the new `Colors` structure
// (e.g., `Colors.dark.backgroundForest` or `Colors.light.backgroundPaper`) once this file is in place.