'use client';

import equal from 'fast-deep-equal';
import { formatDistance } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useDebounceCallback, useWindowSize } from 'usehooks-ts';

import type { Document, Vote } from '@/lib/db/schema';
import { cn, fetcher } from '@/lib/utils';
import { useBlock } from '@/hooks/use-block';
import { textBlock } from '@/blocks/text';
import { imageBlock } from '@/blocks/image';
import { codeBlock } from '@/blocks/code';
import { sheetBlock } from '@/blocks/sheet';

import { MultimodalInput } from './multimodal-input';
import { Toolbar } from './toolbar';
import { VersionFooter } from './version-footer';
import { BlockActions } from './block-actions';
import { BlockCloseButton } from './block-close-button';
import { BlockMessages } from './block-messages';
import { useSidebar } from './ui/sidebar';

export const blockDefinitions = [textBlock, codeBlock, imageBlock, sheetBlock];
export type BlockKind = (typeof blockDefinitions)[number]['kind'];

export interface UIBlock {
  title: string;
  documentId: string;
  kind: BlockKind;
  content: string;
  isVisible: boolean;
  status: 'streaming' | 'idle';
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

function PureBlock({
  votes,
}: {
  votes: Array<Vote> | undefined;
}) {
  const { block, setBlock, metadata, setMetadata } = useBlock();

  const {
    data: documents,
    isLoading: isDocumentsFetching,
    mutate: mutateDocuments,
  } = useSWR<Array<Document>>(
    block.documentId !== 'init' && block.status !== 'streaming'
      ? `/api/document?id=${block.documentId}`
      : null,
    fetcher,
  );

  const [mode, setMode] = useState<'edit' | 'diff'>('edit');
  const [document, setDocument] = useState<Document | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

  const { open: isSidebarOpen } = useSidebar();

  useEffect(() => {
    if (documents && documents.length > 0) {
      const mostRecentDocument = documents.at(-1);

      if (mostRecentDocument) {
        setDocument(mostRecentDocument);
        setCurrentVersionIndex(documents.length - 1);
        setBlock((currentBlock) => ({
          ...currentBlock,
          content: mostRecentDocument.content ?? '',
        }));
      }
    }
  }, [documents, setBlock]);

  useEffect(() => {
    mutateDocuments();
  }, [block.status, mutateDocuments]);

  const { mutate } = useSWRConfig();
  const [isContentDirty, setIsContentDirty] = useState(false);

  const handleContentChange = useCallback(
    (updatedContent: string) => {
      if (!block) return;

      mutate<Array<Document>>(
        `/api/document?id=${block.documentId}`,
        async (currentDocuments) => {
          if (!currentDocuments) return undefined;

          const currentDocument = currentDocuments.at(-1);

          if (!currentDocument || !currentDocument.content) {
            setIsContentDirty(false);
            return currentDocuments;
          }

          if (currentDocument.content !== updatedContent) {
            await fetch(`/api/document?id=${block.documentId}`, {
              method: 'POST',
              body: JSON.stringify({
                title: block.title,
                content: updatedContent,
                kind: block.kind,
              }),
            });

            setIsContentDirty(false);

            const newDocument = {
              ...currentDocument,
              content: updatedContent,
              createdAt: new Date(),
            };

            return [...currentDocuments, newDocument];
          }
          return currentDocuments;
        },
        { revalidate: false },
      );
    },
    [block, mutate],
  );

  const debouncedHandleContentChange = useDebounceCallback(
    handleContentChange,
    2000,
  );

  const saveContent = useCallback(
    (updatedContent: string, debounce: boolean) => {
      if (document && updatedContent !== document.content) {
        setIsContentDirty(true);

        if (debounce) {
          debouncedHandleContentChange(updatedContent);
        } else {
          handleContentChange(updatedContent);
        }
      }
    },
    [document, debouncedHandleContentChange, handleContentChange],
  );

  function getDocumentContentById(index: number) {
    if (!documents) return '';
    if (!documents[index]) return '';
    return documents[index].content ?? '';
  }

  const handleVersionChange = (type: 'next' | 'prev' | 'toggle' | 'latest') => {
    if (!documents) return;

    if (type === 'latest') {
      setCurrentVersionIndex(documents.length - 1);
      setMode('edit');
    }

    if (type === 'toggle') {
      setMode((mode) => (mode === 'edit' ? 'diff' : 'edit'));
    }

    if (type === 'prev') {
      if (currentVersionIndex > 0) {
        setCurrentVersionIndex((index) => index - 1);
      }
    } else if (type === 'next') {
      if (currentVersionIndex < documents.length - 1) {
        setCurrentVersionIndex((index) => index + 1);
      }
    }
  };

  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  /*
   * NOTE: if there are no documents, or if
   * the documents are being fetched, then
   * we mark it as the current version.
   */

  const isCurrentVersion =
    documents && documents.length > 0
      ? currentVersionIndex === documents.length - 1
      : true;

  const { width: windowWidth, height: windowHeight } = useWindowSize({
    initializeWithValue: false,
  });
  const isMobile = windowWidth ? windowWidth < 768 : false;

  const blockDefinition = blockDefinitions.find(
    (definition) => definition.kind === block.kind,
  );

  if (!blockDefinition) {
    throw new Error('Block definition not found!');
  }

  useEffect(() => {
    if (block.documentId !== 'init') {
      if (blockDefinition.initialize) {
        blockDefinition.initialize({
          documentId: block.documentId,
          setMetadata,
        });
      }
    }
  }, [block.documentId, blockDefinition, setMetadata]);

  return (
    <AnimatePresence>
      <motion.div
        className={`motion flex flex-row h-dvh w-dvw fixed top-0 left-0 z-50 bg-transparent ${block.isVisible ? '' : 'invisible'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: block.isVisible ? 1 : 0 }}
        exit={{ opacity: 0, transition: { delay: 0.4 } }}
      >
        {!isMobile && (
          <motion.div
            className="motion fixed bg-background h-dvh"
            initial={{
              width:
                isSidebarOpen && windowWidth ? windowWidth - 256 : windowWidth,
              right: 0,
            }}
            animate={{
              width: block.isVisible ? windowWidth : undefined,
              right: 0,
            }}
            exit={{
              width:
                isSidebarOpen && windowWidth ? windowWidth - 256 : windowWidth,
              right: 0,
            }}
          />
        )}

        {!isMobile && (
          <motion.div
            className="motion relative w-[400px] bg-dark-background h-dvh shrink-0"
            initial={{ opacity: 0, x: 10, scale: 1 }}
            animate={{
              opacity: block.isVisible ? 1 : 0,
              x: 0,
              scale: 1,
              transition: {
                delay: 0.2,
                type: 'spring',
                stiffness: 200,
                damping: 30,
              },
            }}
            exit={{
              opacity: 0,
              x: 0,
              scale: 1,
              transition: { duration: 0 },
            }}
          >
            <AnimatePresence>
              {!isCurrentVersion && (
                <motion.div
                  className="motion left-0 absolute h-dvh w-[400px] top-0 bg-zinc-900/50 z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: block.isVisible ? 1 : 0 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </AnimatePresence>

            <div className="flex flex-col h-full justify-between items-center gap-4">
              <BlockMessages votes={votes} />

              {block.isVisible && (
                <form className="flex flex-row gap-2 relative items-end w-full px-4 pb-4">
                  <MultimodalInput />
                </form>
              )}
            </div>
          </motion.div>
        )}

        <motion.div
          className="motion fixed bg-black-white-gradient h-dvh flex flex-col md:border-l dark:border-zinc-700 border-zinc-200"
          variants={
            isMobile
              ? {
                  hidden: {
                    opacity: 0,
                    x: block.boundingBox.left,
                    y: block.boundingBox.top,
                    height: block.boundingBox.height,
                    width: block.boundingBox.width,
                    borderRadius: 50,
                  },
                  visible: {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    height: windowHeight,
                    width: windowWidth ? windowWidth : 'calc(100dvw)',
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: 'spring',
                      stiffness: 200,
                      damping: 30,
                      duration: 5000,
                    },
                  },
                }
              : {
                  hidden: {
                    opacity: 0,
                    x: block.boundingBox.left,
                    y: block.boundingBox.top,
                    height: block.boundingBox.height,
                    width: block.boundingBox.width,
                    borderRadius: 50,
                  },
                  visible: {
                    opacity: 1,
                    x: 400,
                    y: 0,
                    height: windowHeight,
                    width: windowWidth
                      ? windowWidth - 400
                      : 'calc(100dvw - 400px)',
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: 'spring',
                      stiffness: 200,
                      damping: 30,
                      duration: 5000,
                    },
                  },
                }
          }
          initial="hidden"
          animate={block.isVisible ? 'visible' : 'hidden'}
          exit={{
            opacity: 0,
            scale: 0.5,
            transition: {
              delay: 0.1,
              type: 'spring',
              stiffness: 600,
              damping: 30,
            },
          }}
        >
          <div className="p-2 flex flex-row justify-between items-start">
            <div className="flex flex-row gap-4 items-start">
              <BlockCloseButton />

              <div className="flex flex-col">
                <div className="font-medium">{block.title}</div>

                {isContentDirty ? (
                  <div className="text-sm text-muted-foreground">
                    Saving changes...
                  </div>
                ) : document ? (
                  <div className="text-sm text-muted-foreground">
                    {`Updated ${formatDistance(
                      new Date(document.createdAt),
                      new Date(),
                      {
                        addSuffix: true,
                      },
                    )}`}
                  </div>
                ) : (
                  <div className="w-32 h-3 mt-2 bg-muted-foreground/20 rounded-md animate-pulse" />
                )}
              </div>
            </div>

            <BlockActions
              block={block}
              currentVersionIndex={currentVersionIndex}
              handleVersionChange={handleVersionChange}
              isCurrentVersion={isCurrentVersion}
              mode={mode}
              metadata={metadata}
              setMetadata={setMetadata}
            />
          </div>

          <div
            className={cn(
              'bg-transparent h-full overflow-y-auto !max-w-full items-center',
              {
                'py-2 px-2': block.kind === 'code',
                'py-8 md:p-20 px-4': block.kind === 'text',
              },
            )}
          >
            <blockDefinition.content
              title={block.title}
              content={
                isCurrentVersion
                  ? block.content
                  : getDocumentContentById(currentVersionIndex)
              }
              mode={mode}
              status={block.status}
              currentVersionIndex={currentVersionIndex}
              suggestions={[]}
              onSaveContent={saveContent}
              isInline={false}
              isCurrentVersion={isCurrentVersion}
              getDocumentContentById={getDocumentContentById}
              isLoading={isDocumentsFetching && !block.content}
              metadata={metadata}
              setMetadata={setMetadata}
            />

            <AnimatePresence>
              {isCurrentVersion && (
                <Toolbar
                  isToolbarVisible={isToolbarVisible}
                  setIsToolbarVisible={setIsToolbarVisible}
                  blockKind={block.kind}
                />
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {!isCurrentVersion && (
              <VersionFooter
                currentVersionIndex={currentVersionIndex}
                documents={documents}
                handleVersionChange={handleVersionChange}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export const Block = memo(PureBlock, (prevProps, nextProps) => {
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
});
