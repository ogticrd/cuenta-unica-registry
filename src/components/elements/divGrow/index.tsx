import React from "react";

interface IProps {
  children: React.ReactNode;
}

export default function DivGrow({ children }: IProps) {
  return (
    <div style={{ display: "flex" }}>
      <div style={{ fontWeight: "bold", flexGrow: 1 }} />
      {children}
    </div>
  );
}
