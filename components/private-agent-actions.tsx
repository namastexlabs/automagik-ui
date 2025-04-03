import { EditIcon } from 'lucide-react';
import Link from 'next/link';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import type { AgentDTO } from '@/lib/data/agent';
import { TrashIcon } from './icons';

export function PrivateAgentActions({
  setAgentDelete,
  agent,
}: {
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
            asChild
          >
            <Link href={`/agents/${agent.id}`}>
              <EditIcon />
            </Link>
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
