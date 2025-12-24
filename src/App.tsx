import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DiaryProvider } from "./contexts/DiaryContext";
import Layout from "./components/Layout";
import {
  HomePage,
  LibraryPage,
  DiaryDetailPage,
  MaterialDetailPage,
  SurpriseDetailPage,
  ChatPage,
} from "./pages";

const App: React.FC = () => {
  return (
    <DiaryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="diary/:id" element={<DiaryDetailPage />} />
            <Route path="material/:id" element={<MaterialDetailPage />} />
            <Route path="surprise/:date" element={<SurpriseDetailPage />} />
            <Route path="chat" element={<ChatPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DiaryProvider>
  );
};

export default App;
