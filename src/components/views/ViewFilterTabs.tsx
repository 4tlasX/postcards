'use client';

export interface FilterTab {
  key: string;
  label: string;
}

interface ViewFilterTabsProps {
  tabs: FilterTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function ViewFilterTabs({ tabs, activeTab, onTabChange }: ViewFilterTabsProps) {
  return (
    <div className="view-filter-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`view-filter-tab ${activeTab === tab.key ? 'view-filter-tab-active' : ''}`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
