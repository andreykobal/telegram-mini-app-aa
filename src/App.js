// App.js

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home';
import Swap from './Swap';
import Buy from './Buy';
import { CheckoutForm, Return } from './StripeCheckout'; // Import the new Stripe component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/swap" element={<Swap />} />
        <Route path="/buy" element={<Buy />} />
        <Route path="/checkout" element={<CheckoutForm />} />
        <Route path="/return" element={<Return />} />
      </Routes>
    </Router>
  );
}

export default App;
