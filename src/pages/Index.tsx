import { useState } from "react";
import { motion } from "framer-motion";
import { ImageIcon, ArrowRight, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const formats = [
  { id: "JPG", label: "JPG", description: "Formato universal, ótima compressão" },
  { id: "WEBP", label: "WEBP", description: "Moderno, menor tamanho" },
  { id: "PNG", label: "PNG", description: "Alta qualidade, suporta transparência" },
];

const Index = () => {
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleFormatToggle = (format: string) => {
    setSelectedFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    );
  };

  const handleConvert = async () => {
    if (selectedFormats.length === 0) {
      toast({
        title: "Selecione ao menos um formato",
        description: "Escolha para qual formato deseja converter suas imagens.",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);

    try {
      // Execute the n8n workflow
      const response = await fetch("https://n8n.agenciabzs.com.br/form/266e922f-b68d-451a-89ec-4d8e066db4ff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "Para qual formato de imagem você deseja converter?": selectedFormats,
        }),
      });

      if (response.ok) {
        setIsComplete(true);
        toast({
          title: "Conversão iniciada!",
          description: "Suas imagens estão sendo processadas.",
        });
      } else {
        throw new Error("Erro ao iniciar conversão");
      }
    } catch (error) {
      toast({
        title: "Erro na conversão",
        description: "Não foi possível iniciar o processo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const resetForm = () => {
    setSelectedFormats([]);
    setIsComplete(false);
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
          {isComplete ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/20 mb-6">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Conversão Iniciada!
              </h2>
              <p className="text-muted-foreground mb-6">
                Suas imagens estão sendo processadas. Você receberá as imagens convertidas em breve.
              </p>
              <Button onClick={resetForm} variant="outline" size="lg">
                Converter mais imagens
              </Button>
            </motion.div>
          ) : (
            <>
              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-4 block">
                  Para qual formato deseja converter?
                </label>
                <div className="space-y-3">
                  {formats.map((format, index) => (
                    <motion.div
                      key={format.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <label
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                          selectedFormats.includes(format.id)
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <Checkbox
                          checked={selectedFormats.includes(format.id)}
                          onCheckedChange={() => handleFormatToggle(format.id)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-foreground">
                            {format.label}
                          </span>
                          <p className="text-sm text-muted-foreground">
                            {format.description}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            .{format.id.toLowerCase()}
                          </span>
                        </div>
                      </label>
                    </motion.div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleConvert}
                disabled={isConverting || selectedFormats.length === 0}
                size="lg"
                className="w-full h-14 text-lg font-semibold group"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Converter Imagens
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </>
          )}
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
