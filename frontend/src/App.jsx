import { Routes, Route } from "react-router-dom";

import Dashboard from "./Pages/Dashboard";
import Data from "./Pages/Data";
import Graphs from "./Pages/Graphs";
import Map from "./Pages/Map";
//import Prediction from "./Pages/Prediction";
function App() {
  return (
      <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/Data" element={<Data />} />
      <Route path="/graphs" element={<Graphs/>}/>
      <Route path="/map" element={<Map />} />
      {/* <Route path="/prediction" element={<Prediction />} /> */}
      </Routes>
  );
}

export default App;
