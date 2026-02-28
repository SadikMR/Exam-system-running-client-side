import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "katex/dist/katex.min.css";
import { RouterProvider } from "react-router-dom";
import router from "./Route"; // Import the router from Routes.js
import html2canvas from "html2canvas";
window.html2canvas = html2canvas; // html2pdf will use this renderer

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
