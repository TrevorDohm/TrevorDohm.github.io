// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { HashRouter, Routes, Route } from "react-router-dom";
// import Navigation from "./components/Navigation";
// import About from "./pages/About";
// import Projects from "./pages/Projects";
// import Blog from "./pages/Blog";
// import './App.css'

// const queryClient = new QueryClient();

// function App() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <HashRouter>
//         <Navigation />
//         <Routes>
//         <Route path="/" element={<About />} />
//         <Route path="/projects" element={<Projects />} />
//         <Route path="/blog" element={<Blog />} />
//         </Routes>
//       </HashRouter>
//     </QueryClientProvider>
//   )
// }

// export default App
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Error from "./pages/Error";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* <TooltipProvider>
      <Toaster />
      <Sonner /> */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<Error />} />
        </Routes>
      </BrowserRouter>
    {/* </TooltipProvider> */}
  </QueryClientProvider>
);

export default App;