import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBuilding } from '@/contexts/BuildingContext';
import { useLanguage } from '@/contexts/LanguageContext';

export function BuildingSwitcher() {
  const { availableBuildings, currentBuilding, setCurrentBuildingId, isLoading } = useBuilding();
  const { language } = useLanguage();

  // Hide the switcher entirely if the user only has access to one building —
  // there's nothing to switch to, and the sidebar already implies the scope.
  if (isLoading || availableBuildings.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 max-w-[200px] pr-2"
          aria-label={language === 'bn' ? 'বিল্ডিং পরিবর্তন' : 'Switch building'}
        >
          <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate text-xs lg:text-sm">
            {currentBuilding?.name ?? (language === 'bn' ? 'বিল্ডিং নির্বাচন' : 'Select building')}
          </span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          {language === 'bn' ? 'আপনার বিল্ডিংসমূহ' : 'Your buildings'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableBuildings.map((b) => {
          const isCurrent = b.id === currentBuilding?.id;
          return (
            <DropdownMenuItem
              key={b.id}
              onSelect={() => setCurrentBuildingId(b.id)}
              className="cursor-pointer"
            >
              <div className="flex flex-1 flex-col min-w-0">
                <span className="text-sm font-medium truncate">{b.name}</span>
                {b.address && (
                  <span className="text-xs text-muted-foreground truncate">{b.address}</span>
                )}
              </div>
              {isCurrent && <Check className="ml-2 h-4 w-4 shrink-0" aria-hidden="true" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
