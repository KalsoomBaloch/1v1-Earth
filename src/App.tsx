import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MuteButton } from "@/components/MuteButton";
import HomeScreen from "./pages/HomeScreen";
import MatchmakingScreen from "./pages/MatchmakingScreen";
import DuelScreen from "./pages/DuelScreen";
import TicTacToeScreen from "./pages/TicTacToeScreen";
import WordScrambleScreen from "./pages/WordScrambleScreen";
import HangmanScreen from "./pages/HangmanScreen";
import ResultScreen from "./pages/ResultScreen";
import LeaderboardScreen from "./pages/LeaderboardScreen";
import ProfileScreen from "./pages/ProfileScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MuteButton />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/matchmaking" element={<MatchmakingScreen />} />
          <Route path="/duel" element={<DuelScreen />} />
          <Route path="/tictactoe" element={<TicTacToeScreen />} />
          <Route path="/wordscramble" element={<WordScrambleScreen />} />
          <Route path="/hangman" element={<HangmanScreen />} />
          <Route path="/result" element={<ResultScreen />} />
          <Route path="/leaderboard" element={<LeaderboardScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
