'use client';

import { SlidersHorizontal } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useChatHandlers, useChatInput } from '@/contexts/chat';
import { Label } from './ui/label';
import { Input } from './ui/input';

export function ModelParameters() {
  const { temperature, topP, presencePenalty, frequencyPenalty } =
    useChatInput();
  const { setTemperature, setTopP, setPresencePenalty, setFrequencyPenalty } =
    useChatHandlers();

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full p-2 size-8 bg-secondary"
            >
              <SlidersHorizontal size={20} />
              <span className="sr-only">Model Parameters</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Adjust model parameters</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-96 py-6 px-4 bg-accent">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Model Parameters</h4>
            <p className="text-sm text-muted-foreground">
              Adjust the language model parameters
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Label htmlFor="temperature" className="w-32">
                Temperature
              </Label>
              <div className="flex gap-2 flex-1">
                <Slider
                  id="temperature"
                  max={2}
                  min={0}
                  step={0.1}
                  value={[temperature]}
                  onValueChange={([value]) => setTemperature(value)}
                  className="w-full"
                />
                <Input
                  id="temperature"
                  className="w-8 h-fit border border-lighter-gray p-0.5 text-xs bg-transparent text-center"
                  value={temperature.toFixed(1)}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="top-p" className="w-32">
                Top P
              </Label>
              <div className="flex gap-2 flex-1">
                <Slider
                  id="top-p"
                  max={1}
                  min={0}
                  step={0.1}
                  value={[topP]}
                  onValueChange={([value]) => setTopP(value)}
                  className="w-full"
                />
                <Input
                  id="top-p"
                  className="w-8 h-fit border border-lighter-gray p-0.5 text-xs bg-transparent text-center"
                  value={topP.toFixed(1)}
                  onChange={(e) => setTopP(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="presence-penalty" className="w-32">
                Presence Penalty
              </Label>
              <div className="flex gap-2 flex-1">
                <Slider
                  id="presence-penalty"
                  max={1}
                  min={-1}
                  step={0.1}
                  value={[presencePenalty]}
                  onValueChange={([value]) => setPresencePenalty(value)}
                />
                <Input
                  id="presence-penalty"
                  className="w-8 h-fit border border-lighter-gray p-0.5 text-xs bg-transparent text-center"
                  value={presencePenalty.toFixed(1)}
                  onChange={(e) => setPresencePenalty(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="frequency-penalty" className="w-32">
                Frequency Penalty
              </Label>
              <div className="flex gap-2 flex-1">
                <Slider
                  id="frequency-penalty"
                  max={1}
                  min={-1}
                  step={0.1}
                  value={[frequencyPenalty]}
                  onValueChange={([value]) => setFrequencyPenalty(value)}
                  className="w-full"
                />
                <Input
                  id="frequency-penalty"
                  className="w-8 h-fit border border-lighter-gray p-0.5 text-xs bg-transparent text-center"
                  value={frequencyPenalty.toFixed(1)}
                  onChange={(e) => setFrequencyPenalty(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
