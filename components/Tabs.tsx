'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface TabProps {
  label: string;
  children: React.ReactNode;
}

interface TabsProps {
  children: React.ReactElement<TabProps>[];
  defaultTab?: string;
}

export function Tabs({ children, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || children[0].props.label);

  return (
    <div className="w-full">
      <div className="flex space-x-6 border-b border-white/5 mb-6">
        {children.map((child) => (
          <button
            key={child.props.label}
            onClick={() => setActiveTab(child.props.label)}
            className={cn(
              "pb-4 text-xs font-mono uppercase tracking-widest transition-colors",
              activeTab === child.props.label
                ? "text-white border-b border-emerald-500"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {child.props.label}
          </button>
        ))}
      </div>
      <div>
        {children.find((child) => child.props.label === activeTab)?.props.children}
      </div>
    </div>
  );
}

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}
