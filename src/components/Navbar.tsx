import { motion } from "framer-motion";
import { NavLink } from "./NavLink";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { TOOL_ITEMS } from "@/lib/toolMeta";

const Navbar = () => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-fit">
      <nav className="flex items-center gap-2 p-2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl">
        {TOOL_ITEMS.map((tool) => {
          const Icon = tool.icon;

          return (
            <HoverCard key={tool.key} openDelay={150} closeDelay={80}>
              <HoverCardTrigger asChild>
                <div>
                  <NavLink
                    to={tool.route}
                    className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl text-sm sm:text-base font-black transition-all duration-300 hover:bg-white/10 text-muted-foreground"
                    activeClassName="bg-primary text-primary-foreground shadow-xl !text-primary-foreground"
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="whitespace-nowrap">{tool.label}</span>
                  </NavLink>
                </div>
              </HoverCardTrigger>
              <HoverCardContent
                side="bottom"
                align="center"
                className="w-[280px] sm:w-[320px] rounded-2xl border-white/10 bg-card/95 backdrop-blur-2xl p-4"
              >
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div>
                    <h4 className="font-black text-base tracking-tight">{tool.hoverTitle}</h4>
                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed mt-1">{tool.hoverDescription}</p>
                  </div>
                  <div className="space-y-2">
                    {tool.hoverSteps.map((step, index) => (
                      <div key={`${tool.key}-step-${index}`} className="flex items-start gap-2 text-xs font-semibold text-foreground/90">
                        <span className="w-5 h-5 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black shrink-0">
                          {index + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </nav>
    </div>
  );
};

export default Navbar;
