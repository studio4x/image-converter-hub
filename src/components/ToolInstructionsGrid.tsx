import { Card } from "@/components/ui/card";

interface ToolInstructionsGridProps {
  title: string;
  subtitle: string;
  steps: string[];
}

const ToolInstructionsGrid = ({ title, subtitle, steps }: ToolInstructionsGridProps) => {
  return (
    <section className="mb-8 sm:mb-10">
      <div className="mb-4 sm:mb-5">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{title}</h2>
        <p className="text-sm sm:text-base text-muted-foreground font-semibold mt-1">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {steps.map((step, index) => (
          <Card
            key={`${title}-${index}`}
            className="p-4 sm:p-5 rounded-2xl bg-card/40 backdrop-blur-2xl border border-white/10 shadow-lg"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center text-sm font-black mb-3">
              {index + 1}
            </div>
            <p className="text-sm sm:text-[15px] font-bold leading-relaxed text-foreground/90">{step}</p>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default ToolInstructionsGrid;
