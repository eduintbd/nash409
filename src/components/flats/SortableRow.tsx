import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, GripVertical, Car } from 'lucide-react';
import { Flat } from '@/hooks/useFlats';
import { Owner } from '@/hooks/useOwners';
import { Tenant } from '@/hooks/useTenants';

interface SortableRowProps {
  flat: Flat;
  owner?: Owner;
  tenant?: Tenant;
  isAdmin: boolean;
  isReorderMode: boolean;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
  onDetails: (flat: Flat) => void;
  onEdit: (flat: Flat) => void;
  onDelete: (flat: Flat) => void;
  t: any;
}

export const SortableRow = ({
  flat,
  owner,
  tenant,
  isAdmin,
  isReorderMode,
  statusColors,
  statusLabels,
  onDetails,
  onEdit,
  onDelete,
  t,
}: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: flat.id, disabled: !isReorderMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const contactPerson = flat.status === 'tenant' && tenant ? tenant : owner;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`table-row-hover ${isDragging ? 'bg-muted' : ''}`}
    >
      {isReorderMode && (
        <TableCell className="w-10">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </TableCell>
      )}
      <TableCell className="text-muted-foreground min-w-[120px]">
        {flat.building_name || '-'}
      </TableCell>
      <TableCell className="font-semibold w-24">{flat.flat_number}</TableCell>
      <TableCell className="min-w-[100px]">{owner?.name || '-'}</TableCell>
      <TableCell className="min-w-[100px]">{tenant?.name || '-'}</TableCell>
      <TableCell className="w-16 text-center">{flat.floor}</TableCell>
      <TableCell className="w-20 text-right">{flat.size.toLocaleString()}</TableCell>
      <TableCell className="w-28">
        <Badge variant="outline" className={statusColors[flat.status]}>
          {statusLabels[flat.status]}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm min-w-[120px]">
        {contactPerson?.phone || '-'}
      </TableCell>
      <TableCell className="w-20">
        {flat.parking_spot ? (
          <span className="flex items-center gap-1 text-sm">
            <Car className="h-3 w-3" /> {flat.parking_spot}
          </span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )}
      </TableCell>
      <TableCell className="text-right w-32">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => onDetails(flat)}>
            {t.common.details}
          </Button>
          {isAdmin && !isReorderMode && (
            <>
              <Button variant="ghost" size="icon" onClick={() => onEdit(flat)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onDelete(flat)}
                disabled={flat.status !== 'vacant'}
                title={flat.status !== 'vacant' ? 'Only vacant flats can be deleted' : ''}
              >
                <Trash2 className={`h-4 w-4 ${flat.status === 'vacant' ? 'text-destructive' : 'text-muted-foreground'}`} />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
