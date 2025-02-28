// src/App.js

import React from 'react';
import Navbar from './components/navbar';

function App() {
  return (
<>

<Navbar/>

    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
     
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-center text-indigo-600 ">
          Welcome to Tailwind + React!
        </h1>
        <p className=" mt-4 text-gray-600 ">
          This is a simple setup to get you started with Tailwind CSS in a React application.
        </p>
      </div>
    </div>
    </>
  );
}

export default App;
