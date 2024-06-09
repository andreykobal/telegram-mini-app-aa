// In your App.js or main routing file, add the new route for the /swap page

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home';
import Swap from './Swap'; // Import the new Swap component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/swap" element={<Swap />} /> {/* Add this line for the /swap route */}
      </Routes>
    </Router>
  );
}

export default App;
