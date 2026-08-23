import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './theme/ThemeProvider';
import { Landing } from './routes/Landing';
import { ResumeAnalyzer } from './routes/ResumeAnalyzer';
import { InterviewRoom } from './routes/InterviewRoom';
import { Scorecard } from './routes/Scorecard';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="w-full min-h-screen"
      >
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
          <Route path="/interview" element={<InterviewRoom />} />
          <Route path="/scorecard" element={<Scorecard />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
