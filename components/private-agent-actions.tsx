import { EditIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import type { ClientAgent } from '@/lib/data';

import { TrashIcon } from './icons';

export function PrivateAgentActions({ openAgentDialog, setAgentDelete, agent }: {
  openAgentDialog: (id: string) => void;
  setAgentDelete: (id: string) => void;
  agent: ClientAgent;
}) {
  return (
    <div className="flex item-center space-x-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="size-8 p-1"
            onClick={(e) => {
              e.stopPropagation();
              openAgentDialog(agent.id);
            }}
          >
            <EditIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit Agent</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="hover:bg-destructive size-8 p-1"
            onClick={(e) => {
              e.stopPropagation();
              setAgentDelete(agent.id);
            }}
          >
            <TrashIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete Agent</TooltipContent>
      </Tooltip>
    </div>
  );
}
