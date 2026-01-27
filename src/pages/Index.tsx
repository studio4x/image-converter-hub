import { motion } from "framer-motion";
import { ImageIcon, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Index = () => {
  const handleConvert = () => {
    window.open("https://n8n.agenciabzs.com.br/form/266e922f-b68d-451a-89ec-4d8e066db4ff", "_blank");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-radial from-accent/20 via-transparent to-transparent" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent mb-6 shadow-glow"
          >
            <ImageIcon className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">
            Conversor de Imagens
          </h1>
          <p className="text-muted-foreground text-lg">
            Converta suas imagens para diferentes formatos em segundos
          </p>
        </div>

        {/* Main Card */}
        <Card className="p-8 bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl">
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Formatos suportados
              </h2>
              <div className="flex justify-center gap-4">
                {["JPG", "PNG", "WEBP"].map((format, index) => (
                  <motion.div
                    key={format}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="px-4 py-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30"
                  >
                    <span className="text-sm font-bold text-primary">.{format.toLowerCase()}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <ul className="text-left space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Upload de múltiplas imagens
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Controle de compressão personalizável
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Download em ZIP para múltiplos arquivos
              </li>
            </ul>

            <Button
              onClick={handleConvert}
              size="lg"
              className="w-full h-14 text-lg font-semibold group"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Iniciar Conversão
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </Card>

        {/* Footer info */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Powered by n8n automation
        </p>
      </motion.div>
    </div>
  );
};

export default Index;
