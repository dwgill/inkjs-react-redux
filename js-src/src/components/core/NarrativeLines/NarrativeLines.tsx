import { EntityId } from "@reduxjs/toolkit";
import React, {
  Children,
  memo,
  ReactNode,
  useContext,
  useLayoutEffect,
} from "react";
import { getLine, getLineIds } from "../../../state/redux/selectors/story";
import {
  LineBreakLevel,
  LineKind,
} from "../../../state/redux/slices/story/lines";
import { useSelector } from "../../../state/redux/store";
import splitArray from "../../../util/splitArray";
import Line from "../../ui/Line";
import LinesBox from "../../ui/LinesBox";
import Paragraph from "../../ui/Paragraph";
import {
  paragraphRegistryContext,
  useParagraphIndexMap,
} from "./paragraphRegistry";

export default memo(function NarrativeLines() {
  const lineIds = useSelector(getLineIds);
  const [pIndexMap, pRegistry] = useParagraphIndexMap();

  const linesByParagraph = splitArray(
    lineIds,
    (_, index) => index in pIndexMap,
    /**
     * It's imperative that we actually render delimiters.
     * They may render something to the DOM (such as an hr)
     * but since they notify the registry about existing in
     * the first place, we'll immediately forget they're
     * delimiters if we fail to render them. This causes an
     * infinite loop of rendering:
     * 1: recognize that they're delimiters
     * 2: stop rendering them because they're delimiters
     * 3: stop recognizing them as delimiters
     * 4: render them because we think they're normal text
     * 5: repeat
     */
    "start"
  );

  return (
    <LinesBox>
      <paragraphRegistryContext.Provider value={pRegistry}>
        {linesByParagraph.map((paragraphOfLineIds, pIndex) => {
          const isFirstParagraph = pIndex === 0;
          const [firstLineId, ...lineIds] = paragraphOfLineIds;
          const firstLineIdOfParagraph = isFirstParagraph
            ? firstLineId
            : lineIds[0];
          return (
            <React.Fragment key={paragraphOfLineIds[0]}>
              {!isFirstParagraph && (
                <LineWrapper
                  key={firstLineId}
                  lineId={firstLineId}
                  outsideParagraph
                />
              )}
              {(isFirstParagraph || !!lineIds.length) && (
                <ParagraphWrapper firstLineId={firstLineIdOfParagraph}>
                  {isFirstParagraph && (
                    <LineWrapper key={firstLineId} lineId={firstLineId} />
                  )}
                  {lineIds.map((lineId) => (
                    <LineWrapper key={lineId} lineId={lineId} />
                  ))}
                </ParagraphWrapper>
              )}
            </React.Fragment>
          );
        })}
      </paragraphRegistryContext.Provider>
    </LinesBox>
  );
});

interface LineWrapperProps {
  lineId: EntityId;
  outsideParagraph?: boolean;
}
const LineWrapper = memo(function LineWrapper({
  lineId,
  outsideParagraph = false,
}: LineWrapperProps) {
  const line = useSelector((state) => getLine(state, lineId));
  if (line == null) {
    return null;
  }
  return (
    <>
      {line.lineKind === LineKind.Empty &&
        line.breakLevel !== LineBreakLevel.None && (
          <NewParagraph index={line.index} />
        )}
      <Line lineData={line} outsideParagraph={outsideParagraph} />
    </>
  );
});

interface NewParagraphProps {
  index: number;
}
function NewParagraph({ index }: NewParagraphProps) {
  const registry = useContext(paragraphRegistryContext);
  useLayoutEffect(() => {
    registry.register(index);
    return () => {
      registry.unregister(index);
    };
  }, [registry, index]);

  return null;
}

interface ParagraphWrapperProps {
  firstLineId: EntityId;
  children: ReactNode;
}
const ParagraphWrapper = memo(function ParagraphWrapper({
  firstLineId,
  children,
}: ParagraphWrapperProps) {
  const line = useSelector((state) => getLine(state, firstLineId));
  return <Paragraph firstLine={line ?? null}>{children}</Paragraph>;
});
