import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function InfoTip({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex text-muted-foreground hover:text-accent transition">
            <HelpCircle className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs leading-relaxed">{children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const PLAIN_ENGLISH: Record<string, string> = {
  mean: "The average — add everything up and divide by how many numbers.",
  median: "The middle value when sorted — half are below it, half above.",
  mode: "The most common value in your data.",
  variance: "How spread out the numbers are from the average.",
  stdev: "The typical distance of a value from the average. Lower = more consistent.",
  range: "Largest value minus smallest value.",
  iqr: "Middle 50% of your data — robust to outliers.",
  skew: "If positive, the tail leans right (a few big values). Negative leans left.",
  kurtosis: "How heavy the tails are. Positive = more extreme values than normal.",
  cv: "Relative spread (% of the mean). Lets you compare consistency across different scales.",
  sem: "How precisely the mean is estimated.",
  ci95: "95% confidence interval — we're 95% sure the true mean falls inside this range.",
  r2: "How much of the variation one variable explains in another. 0 = none, 1 = perfect.",
  pvalue: "Probability the result is due to chance. Below 0.05 is usually 'significant'.",
  ttest: "Compares a sample's mean against a known value or another sample.",
  anova: "Compares the means of 3+ groups to see if they differ significantly.",
};