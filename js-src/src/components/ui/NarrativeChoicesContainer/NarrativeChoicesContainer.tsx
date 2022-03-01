import React, { ReactNode } from "react";

interface NarrativeChoicesContainerProps {
  children: ReactNode;
}
export default function NarrativeChoicesContainer({
  children,
}: NarrativeChoicesContainerProps) {
  return <ul>{children}</ul>;
}