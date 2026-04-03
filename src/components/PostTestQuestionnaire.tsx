import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface QuestionnaireData {
  ageGroup: string;
  dailyScreenTime: string;
  screenUseBeforeTest: string;
  wearsGlasses: boolean | null;
  lightingCondition: string;
}

interface Props {
  open: boolean;
  onSubmit: (data: QuestionnaireData) => void;
}

const AGE_OPTIONS = ["Under 13", "13–15", "16–18", "18+"];
const SCREEN_TIME_OPTIONS = ["<2 hours", "2–4 hours", "4–6 hours", "6+ hours"];
const BEFORE_TEST_OPTIONS = ["<30 min", "30–60 min", "1–2 hours", "2+ hours"];
const LIGHTING_OPTIONS = ["Bright", "Normal", "Dim", "Dark"];

export function PostTestQuestionnaire({ open, onSubmit }: Props) {
  const [ageGroup, setAgeGroup] = useState("");
  const [dailyScreenTime, setDailyScreenTime] = useState("");
  const [screenUseBefore, setScreenUseBefore] = useState("");
  const [wearsGlasses, setWearsGlasses] = useState<boolean | null>(null);
  const [lighting, setLighting] = useState("");

  const isValid =
    ageGroup && dailyScreenTime && screenUseBefore && wearsGlasses !== null && lighting;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({
      ageGroup,
      dailyScreenTime,
      screenUseBeforeTest: screenUseBefore,
      wearsGlasses,
      lightingCondition: lighting,
    });
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto border-border bg-card"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-mono text-xl tracking-wide">
            Post-Test Questionnaire
          </DialogTitle>
          <DialogDescription>
            Please answer these quick questions to help us analyze your results.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Age Group */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-foreground">Age Group</legend>
            <RadioGroup value={ageGroup} onValueChange={setAgeGroup} className="grid grid-cols-2 gap-2">
              {AGE_OPTIONS.map((opt) => (
                <Label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm transition-colors hover:bg-muted/60 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"
                >
                  <RadioGroupItem value={opt} />
                  {opt}
                </Label>
              ))}
            </RadioGroup>
          </fieldset>

          {/* Daily Screen Time */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-foreground">Daily Screen Time</legend>
            <RadioGroup value={dailyScreenTime} onValueChange={setDailyScreenTime} className="grid grid-cols-2 gap-2">
              {SCREEN_TIME_OPTIONS.map((opt) => (
                <Label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm transition-colors hover:bg-muted/60 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"
                >
                  <RadioGroupItem value={opt} />
                  {opt}
                </Label>
              ))}
            </RadioGroup>
          </fieldset>

          {/* Screen Use Before Test */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-foreground">Screen Use Before Test</legend>
            <RadioGroup value={screenUseBefore} onValueChange={setScreenUseBefore} className="grid grid-cols-2 gap-2">
              {BEFORE_TEST_OPTIONS.map((opt) => (
                <Label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm transition-colors hover:bg-muted/60 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"
                >
                  <RadioGroupItem value={opt} />
                  {opt}
                </Label>
              ))}
            </RadioGroup>
          </fieldset>

          {/* Glasses */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-foreground">
              Do you wear glasses/contact lenses?
            </legend>
            <RadioGroup
              value={wearsGlasses === null ? "" : wearsGlasses ? "yes" : "no"}
              onValueChange={(v) => setWearsGlasses(v === "yes")}
              className="grid grid-cols-2 gap-2"
            >
              {[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ].map((opt) => (
                <Label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm transition-colors hover:bg-muted/60 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"
                >
                  <RadioGroupItem value={opt.value} />
                  {opt.label}
                </Label>
              ))}
            </RadioGroup>
          </fieldset>

          {/* Lighting */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-foreground">Lighting Conditions</legend>
            <RadioGroup value={lighting} onValueChange={setLighting} className="grid grid-cols-3 gap-2">
              {LIGHTING_OPTIONS.map((opt) => (
                <Label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm transition-colors hover:bg-muted/60 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"
                >
                  <RadioGroupItem value={opt} />
                  {opt}
                </Label>
              ))}
            </RadioGroup>
          </fieldset>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSubmit} disabled={!isValid} className="font-mono tracking-wider">
            SUBMIT
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
