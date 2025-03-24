import { InternalToolName } from "./tool-declarations/client";
import type { Source } from "./types";

export const getToolSource = (toolName: string) => {
  let source: Source = toolName.split('-')[0] as Source;

  if (!['automagik', 'internal'].includes(source)) {
    const isInternal = Object.values(InternalToolName).includes(
      toolName as InternalToolName,
    );

    source = isInternal ? 'internal' : 'automagik';
  }

  return source;
};

export const getToolName = (toolName: string) => {
  return toolName.split('-')[1];
};
