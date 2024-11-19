import { Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import AuthLayout from "./pages/layout";
import "./global.css";
import Dashboard from "./components/Filelist";
import Profile from "./pages/profile";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AuthLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
};

export default App;
