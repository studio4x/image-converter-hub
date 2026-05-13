import { NavLink } from "./NavLink";
import { Scissors, Repeat } from "lucide-react";
import { motion } from "framer-motion";

const Navbar = () => {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-fit">
      <nav className="flex items-center gap-2 p-2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl">
        <NavLink
          to="/"
          className="flex items-center gap-3 px-6 py-3 rounded-2xl text-lg font-black transition-all duration-300 hover:bg-white/10 text-muted-foreground"
          activeClassName="bg-primary text-primary-foreground shadow-xl !text-primary-foreground"
        >
          <Repeat className="w-5 h-5" />
          <span>Converter</span>
        </NavLink>
        <NavLink
          to="/crop"
          className="flex items-center gap-3 px-6 py-3 rounded-2xl text-lg font-black transition-all duration-300 hover:bg-white/10 text-muted-foreground"
          activeClassName="bg-primary text-primary-foreground shadow-xl !text-primary-foreground"
        >
          <Scissors className="w-5 h-5" />
          <span>Cortar</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Navbar;
