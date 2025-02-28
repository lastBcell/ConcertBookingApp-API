// import { useState } from "react";
// import { NavLink } from "react-router-dom";
// import { motion } from "framer-motion";
// import { Menu, X } from "lucide-react";
import React from 'react';

export default function Navbar() {
//   const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gray-900 text-white p-4">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      
      <h1 className="text-2xl font-bold">MyBrand</h1>

     
      <ul className="flex space-x-6">
      <li>
  <h4 className="text-sm hover:text-blue-400">Home</h4>
</li>
<li>
  <h4 className="text-sm hover:text-blue-400">About</h4>
</li>
<li>
  <h4 className="text-sm hover:text-blue-400">Services</h4>
</li>
<li>
  <h4 className="text-sm hover:text-blue-400">Contact</h4>
</li>
<li>
  <h4 className="text-sm hover:text-blue-400">Home</h4>
</li>
<li>
  <h4 className="text-sm hover:text-blue-400">About</h4>
</li>
<li>
  <h4 className="text-sm hover:text-blue-400">Services</h4>
</li>
<li>
  <h4 className="text-sm hover:text-blue-400">Contact</h4>
</li>

      </ul>
    </div>
  </nav>
   
  );
}
