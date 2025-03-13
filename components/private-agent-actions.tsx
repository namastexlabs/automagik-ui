import { EditIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import type { AgentDTO } from '@/lib/data/agent';

import { TrashIcon } from './icons';

export function PrivateAgentActions({
  openAgentDialog,
  setAgentDelete,
  agent,
}: {
  openAgentDialog: (id: string) => void;
  setAgentDelete: (id: string) => void;
  agent: AgentDTO;
}) {
  return (
    <div className="flex item-center space-x-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="size-[48px] p-1"
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
            className="hover:bg-destructive size-[48px] p-1"
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
