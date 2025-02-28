import { createBrowserRouter } from "react-router-dom";
import Aboutus from "./components/about";
import App from "./App";

const router = createBrowserRouter([
    { path: '', element: <App/> },
    { path: 'aboutus', element: <Aboutus/> },
]);

export default router;