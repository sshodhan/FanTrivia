'use client';

import { Button } from '@/components/ui/button';

interface MultiSelectToolbarProps {
  isMultiSelectMode: boolean;
  selectedCount: number;
  onToggleMultiSelect: () => void;
  onClaimAll: () => void;
  onClearSelection: () => void;
}

export function MultiSelectToolbar({
  isMultiSelectMode,
  selectedCount,
  onToggleMultiSelect,
  onClaimAll,
  onClearSelection,
}: MultiSelectToolbarProps) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Button
        variant={isMultiSelectMode ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleMultiSelect}
        className={isMultiSelectMode ? 'bg-primary text-primary-foreground' : ''}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        {isMultiSelectMode ? 'Multi-Select ON' : 'Select Multiple'}
      </Button>

      {isMultiSelectMode && selectedCount > 0 && (
        <>
          <span className="text-sm text-muted-foreground">
            {selectedCount} selected
          </span>
          <Button
            size="sm"
            onClick={onClaimAll}
            className="bg-primary text-primary-foreground hover:bg-primary/90 ml-auto"
          >
            Claim All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onClearSelection}
          >
            Clear
          </Button>
        </>
      )}
    </div>
  );
}
