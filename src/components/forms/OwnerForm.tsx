import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCreateOwner, useUpdateOwner } from '@/hooks/useOwners';
import { useFlats } from '@/hooks/useFlats';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';

interface OwnerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    nid: string | null;
    emergency_contact: string | null;
    flat_id: string | null;
    ownership_start: string;
  };
  existingFlatIds?: string[];
}

type OccupancyType = 'owner-occupied' | 'for-rent';

export const OwnerForm = ({ open, onOpenChange, editData, existingFlatIds = [] }: OwnerFormProps) => {
  const { language } = useLanguage();
  const { data: flats } = useFlats();
  const createOwner = useCreateOwner();
  const updateOwner = useUpdateOwner();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    nid: '',
    emergency_contact: '',
    flat_ids: [] as string[],
    ownership_start: new Date().toISOString().split('T')[0],
  });

  // Property/Building selection state
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [isNewProperty, setIsNewProperty] = useState(false);
  const [isAddingNewProperty, setIsAddingNewProperty] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [numberOfFlats, setNumberOfFlats] = useState('1');
  const [fromFlatNumber, setFromFlatNumber] = useState('');
  const [toFlatNumber, setToFlatNumber] = useState('');
  const [startFloor, setStartFloor] = useState('1');

  // Track occupancy type for each selected flat
  const [flatOccupancy, setFlatOccupancy] = useState<Record<string, OccupancyType>>({});

  // Get unique building names from flats
  const buildingNames = useMemo(() => {
    const names = new Set<string>();
    flats?.forEach(flat => {
      if (flat.building_name) {
        names.add(flat.building_name);
      }
    });
    return Array.from(names).sort();
  }, [flats]);

  // Filter flats by selected building
  const filteredFlats = useMemo(() => {
    if (!selectedBuilding || isNewProperty) return [];
    return flats?.filter(flat => 
      flat.building_name === selectedBuilding && 
      (flat.status === 'vacant' || flat.status === 'tenant' || existingFlatIds.includes(flat.id))
    ) || [];
  }, [flats, selectedBuilding, existingFlatIds, isNewProperty]);

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        email: editData.email || '',
        phone: editData.phone || '',
        nid: editData.nid || '',
        emergency_contact: editData.emergency_contact || '',
        flat_ids: existingFlatIds,
        ownership_start: editData.ownership_start || new Date().toISOString().split('T')[0],
      });
      // Set existing occupancy based on flat status
      const occupancy: Record<string, OccupancyType> = {};
      existingFlatIds.forEach(flatId => {
        const flat = flats?.find(f => f.id === flatId);
        occupancy[flatId] = flat?.status === 'owner-occupied' ? 'owner-occupied' : 'for-rent';
      });
      setFlatOccupancy(occupancy);
      
      // Set the building from existing flats
      if (existingFlatIds.length > 0) {
        const existingFlat = flats?.find(f => existingFlatIds.includes(f.id));
        if (existingFlat?.building_name) {
          setSelectedBuilding(existingFlat.building_name);
        }
      }
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        nid: '',
        emergency_contact: '',
        flat_ids: [],
        ownership_start: new Date().toISOString().split('T')[0],
      });
      setFlatOccupancy({});
      setSelectedBuilding('');
      setIsNewProperty(false);
      setIsAddingNewProperty(false);
      setNewPropertyName('');
      setNumberOfFlats('1');
      setFromFlatNumber('');
      setToFlatNumber('');
      setStartFloor('1');
    }
  }, [editData, existingFlatIds, open, flats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone,
      nid: formData.nid || null,
      emergency_contact: formData.emergency_contact || null,
      flat_id: formData.flat_ids[0] || null,
      ownership_start: formData.ownership_start,
      flat_ids: formData.flat_ids,
      flat_occupancy: flatOccupancy,
      // For new property with multiple flats
      new_property: isNewProperty ? {
        building_name: newPropertyName,
        number_of_flats: parseInt(numberOfFlats),
        from_flat_number: fromFlatNumber,
        to_flat_number: toFlatNumber,
        start_floor: parseInt(startFloor),
      } : isAddingNewProperty ? {
        building_name: selectedBuilding,
        number_of_flats: parseInt(numberOfFlats),
        from_flat_number: fromFlatNumber,
        to_flat_number: toFlatNumber,
        start_floor: parseInt(startFloor),
      } : null,
    };

    if (editData) {
      await updateOwner.mutateAsync({ id: editData.id, ...data });
    } else {
      await createOwner.mutateAsync(data);
    }
    
    onOpenChange(false);
  };

  const handleFlatToggle = (flatId: string) => {
    setFormData(prev => {
      const newFlatIds = prev.flat_ids.includes(flatId)
        ? prev.flat_ids.filter(id => id !== flatId)
        : [...prev.flat_ids, flatId];
      
      // Set default occupancy for newly added flats
      if (!prev.flat_ids.includes(flatId)) {
        setFlatOccupancy(prevOccupancy => ({
          ...prevOccupancy,
          [flatId]: 'owner-occupied',
        }));
      } else {
        // Remove occupancy when flat is deselected
        setFlatOccupancy(prevOccupancy => {
          const { [flatId]: _, ...rest } = prevOccupancy;
          return rest;
        });
      }
      
      return { ...prev, flat_ids: newFlatIds };
    });
  };

  const handleOccupancyChange = (flatId: string, occupancy: OccupancyType) => {
    setFlatOccupancy(prev => ({
      ...prev,
      [flatId]: occupancy,
    }));
  };

  const handleBuildingChange = (value: string) => {
    if (value === 'new') {
      setIsNewProperty(true);
      setIsAddingNewProperty(false);
      setSelectedBuilding('');
      setFormData(prev => ({ ...prev, flat_ids: [] }));
      setFlatOccupancy({});
    } else {
      setIsNewProperty(false);
      setIsAddingNewProperty(false);
      setSelectedBuilding(value);
      setFormData(prev => ({ ...prev, flat_ids: [] }));
      setFlatOccupancy({});
      setNewPropertyName('');
      setNumberOfFlats('1');
      setFromFlatNumber('');
      setToFlatNumber('');
      setStartFloor('1');
    }
  };

  const t = {
    title: editData 
      ? (language === 'bn' ? 'মালিক সম্পাদনা' : 'Edit Owner')
      : (language === 'bn' ? 'নতুন মালিক যুক্ত করুন' : 'Add New Owner'),
    description: language === 'bn' ? 'ফ্ল্যাট মালিকের তথ্য দিন' : 'Enter flat owner details',
    name: language === 'bn' ? 'নাম' : 'Name',
    namePlaceholder: language === 'bn' ? 'মালিকের নাম' : 'Owner name',
    property: language === 'bn' ? 'প্রপার্টি/বিল্ডিং' : 'Property/Building',
    selectProperty: language === 'bn' ? 'প্রপার্টি নির্বাচন করুন' : 'Select Property',
    newProperty: language === 'bn' ? '+ নতুন প্রপার্টি যুক্ত করুন' : '+ Add New Property',
    flats: language === 'bn' ? 'ফ্ল্যাটসমূহ' : 'Flats',
    selectFlats: language === 'bn' ? 'এক বা একাধিক ফ্ল্যাট নির্বাচন করুন' : 'Select one or more flats',
    phone: language === 'bn' ? 'ফোন নম্বর' : 'Phone Number',
    email: language === 'bn' ? 'ইমেইল' : 'Email',
    nid: language === 'bn' ? 'জাতীয় পরিচয়পত্র (NID)' : 'National ID (NID)',
    nidPlaceholder: language === 'bn' ? 'NID নম্বর' : 'NID number',
    emergency: language === 'bn' ? 'জরুরি যোগাযোগ' : 'Emergency Contact',
    ownershipStart: language === 'bn' ? 'মালিকানা শুরু' : 'Ownership Start',
    cancel: language === 'bn' ? 'বাতিল' : 'Cancel',
    submit: editData 
      ? (language === 'bn' ? 'আপডেট করুন' : 'Update')
      : (language === 'bn' ? 'যুক্ত করুন' : 'Add'),
    floor: language === 'bn' ? 'তলা' : 'Floor',
    tenant: language === 'bn' ? 'ভাড়াটে আছে' : 'Has Tenant',
    vacant: language === 'bn' ? 'খালি' : 'Vacant',
    occupancyType: language === 'bn' ? 'থাকবেন নাকি ভাড়া দেবেন?' : 'Will stay or rent?',
    ownerWillStay: language === 'bn' ? 'মালিক থাকবেন' : 'Owner will stay',
    willRent: language === 'bn' ? 'ভাড়া দেবেন' : 'Will rent out',
    newPropertyName: language === 'bn' ? 'প্রপার্টির নাম' : 'Property Name',
    numberOfFlats: language === 'bn' ? 'ফ্ল্যাট সংখ্যা' : 'Number of Flats',
    fromFlatNumber: language === 'bn' ? 'শুরু ফ্ল্যাট নম্বর' : 'From Flat Number',
    toFlatNumber: language === 'bn' ? 'শেষ ফ্ল্যাট নম্বর' : 'To Flat Number',
    startFloor: language === 'bn' ? 'শুরু তলা' : 'Starting Floor',
    noFlatsAvailable: language === 'bn' ? 'এই প্রপার্টিতে কোন খালি ফ্ল্যাট নেই' : 'No available flats in this property',
    addNewProperty: language === 'bn' ? '+ নতুন প্রপার্টি যুক্ত করুন' : '+ Add Property',
  };

  const canSubmit = formData.name && formData.phone && 
    ((formData.flat_ids.length > 0) || (isNewProperty && fromFlatNumber && newPropertyName) || (isAddingNewProperty && fromFlatNumber));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t.name} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t.namePlaceholder}
              required
            />
          </div>

          {/* Property/Building Selection */}
          <div>
            <Label>{t.property} *</Label>
            <Select
              value={isNewProperty ? 'new' : selectedBuilding}
              onValueChange={handleBuildingChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.selectProperty} />
              </SelectTrigger>
              <SelectContent>
                {buildingNames.map(name => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
                <SelectItem value="new" className="text-primary">
                  <span className="flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    {t.newProperty}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* New Property Fields */}
          {isNewProperty && (
            <div className="space-y-3 p-3 border rounded-md bg-muted/30">
              <div>
                <Label htmlFor="newPropertyName">{t.newPropertyName} *</Label>
                <Input
                  id="newPropertyName"
                  value={newPropertyName}
                  onChange={(e) => setNewPropertyName(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: গ্রিন ভিউ টাওয়ার' : 'e.g., Green View Tower'}
                />
              </div>
              <div>
                <Label htmlFor="numberOfFlats">{t.numberOfFlats} *</Label>
                <Input
                  id="numberOfFlats"
                  type="number"
                  min="1"
                  max="50"
                  value={numberOfFlats}
                  onChange={(e) => setNumberOfFlats(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fromFlatNumber">{t.fromFlatNumber} *</Label>
                  <Select value={fromFlatNumber} onValueChange={setFromFlatNumber}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'bn' ? 'নির্বাচন করুন' : 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="toFlatNumber">{t.toFlatNumber}</Label>
                  <Select value={toFlatNumber} onValueChange={setToFlatNumber}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'bn' ? 'নির্বাচন করুন' : 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="startFloor">{t.startFloor} *</Label>
                <Select value={startFloor} onValueChange={setStartFloor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(floor => (
                      <SelectItem key={floor} value={floor.toString()}>
                        {floor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="p-2 bg-muted/50 rounded-md">
                <p className="text-xs text-muted-foreground mb-2">{t.occupancyType}</p>
                <RadioGroup
                  value={flatOccupancy['new'] || 'owner-occupied'}
                  onValueChange={(value) => setFlatOccupancy(prev => ({ ...prev, 'new': value as OccupancyType }))}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="owner-occupied" id="stay-new" />
                    <label htmlFor="stay-new" className="text-xs cursor-pointer">
                      {t.ownerWillStay}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="for-rent" id="rent-new" />
                    <label htmlFor="rent-new" className="text-xs cursor-pointer">
                      {t.willRent}
                    </label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Flat Selection for Existing Building */}
          {selectedBuilding && !isNewProperty && (
            <div className="space-y-3">
              <div>
                <Label>{t.flats} *</Label>
                <p className="text-sm text-muted-foreground mb-2">{t.selectFlats}</p>
                {filteredFlats.length > 0 ? (
                  <ScrollArea className="h-40 border rounded-md p-2">
                    <div className="space-y-3">
                      {filteredFlats.map(flat => (
                        <div key={flat.id} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`flat-${flat.id}`}
                              checked={formData.flat_ids.includes(flat.id)}
                              onCheckedChange={() => handleFlatToggle(flat.id)}
                              disabled={isAddingNewProperty}
                            />
                            <label
                              htmlFor={`flat-${flat.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {flat.flat_number} ({t.floor} {flat.floor})
                              <span className="ml-2 text-xs text-muted-foreground">
                                {flat.status === 'tenant' ? `- ${t.tenant}` : flat.status === 'vacant' ? `- ${t.vacant}` : ''}
                              </span>
                            </label>
                          </div>
                          
                          {/* Occupancy selection - shown when flat is selected */}
                          {formData.flat_ids.includes(flat.id) && (
                            <div className="ml-6 p-2 bg-muted/50 rounded-md">
                              <p className="text-xs text-muted-foreground mb-2">{t.occupancyType}</p>
                              <RadioGroup
                                value={flatOccupancy[flat.id] || 'owner-occupied'}
                                onValueChange={(value) => handleOccupancyChange(flat.id, value as OccupancyType)}
                                className="flex gap-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="owner-occupied" id={`stay-${flat.id}`} />
                                  <label htmlFor={`stay-${flat.id}`} className="text-xs cursor-pointer">
                                    {t.ownerWillStay}
                                  </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="for-rent" id={`rent-${flat.id}`} />
                                  <label htmlFor={`rent-${flat.id}`} className="text-xs cursor-pointer">
                                    {t.willRent}
                                  </label>
                                </div>
                              </RadioGroup>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                    {t.noFlatsAvailable}
                  </p>
                )}
              </div>

              {/* Add New Property Option */}
              <div className="border-t pt-3">
                <Button
                  type="button"
                  variant={isAddingNewProperty ? "secondary" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setIsAddingNewProperty(!isAddingNewProperty);
                    if (!isAddingNewProperty) {
                      setFormData(prev => ({ ...prev, flat_ids: [] }));
                      setFlatOccupancy({ 'new': 'owner-occupied' });
                    } else {
                      setNumberOfFlats('1');
                      setFromFlatNumber('');
                      setToFlatNumber('');
                      setStartFloor('2');
                      setFlatOccupancy({});
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t.addNewProperty}
                </Button>

                {isAddingNewProperty && (
                  <div className="mt-3 space-y-3 p-3 border rounded-md bg-muted/30">
                    <div>
                      <Label htmlFor="numberOfFlatsExisting">{t.numberOfFlats} *</Label>
                      <Input
                        id="numberOfFlatsExisting"
                        type="number"
                        min="1"
                        max="50"
                        value={numberOfFlats}
                        onChange={(e) => setNumberOfFlats(e.target.value)}
                        placeholder="1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="fromFlatNumberExisting">{t.fromFlatNumber} *</Label>
                        <Input
                          id="fromFlatNumberExisting"
                          value={fromFlatNumber}
                          onChange={(e) => setFromFlatNumber(e.target.value)}
                          placeholder={language === 'bn' ? 'যেমন: 2A' : 'e.g., 2A'}
                        />
                      </div>
                      <div>
                        <Label htmlFor="toFlatNumberExisting">{t.toFlatNumber}</Label>
                        <Input
                          id="toFlatNumberExisting"
                          value={toFlatNumber}
                          onChange={(e) => setToFlatNumber(e.target.value)}
                          placeholder={language === 'bn' ? 'যেমন: 6D' : 'e.g., 6D'}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="startFloorExisting">{t.startFloor} *</Label>
                      <Select value={startFloor} onValueChange={setStartFloor}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(floor => (
                            <SelectItem key={floor} value={floor.toString()}>
                              {floor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-md">
                      <p className="text-xs text-muted-foreground mb-2">{t.occupancyType}</p>
                      <RadioGroup
                        value={flatOccupancy['new'] || 'owner-occupied'}
                        onValueChange={(value) => setFlatOccupancy(prev => ({ ...prev, 'new': value as OccupancyType }))}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="owner-occupied" id="stay-new-existing" />
                          <label htmlFor="stay-new-existing" className="text-xs cursor-pointer">
                            {t.ownerWillStay}
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="for-rent" id="rent-new-existing" />
                          <label htmlFor="rent-new-existing" className="text-xs cursor-pointer">
                            {t.willRent}
                          </label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div>
            <Label htmlFor="phone">{t.phone} *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="01XXXXXXXXX"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email">{t.email}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
          
          <div>
            <Label htmlFor="nid">{t.nid}</Label>
            <Input
              id="nid"
              value={formData.nid}
              onChange={(e) => setFormData({ ...formData, nid: e.target.value })}
              placeholder={t.nidPlaceholder}
            />
          </div>
          
          <div>
            <Label htmlFor="emergency_contact">{t.emergency}</Label>
            <Input
              id="emergency_contact"
              value={formData.emergency_contact}
              onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              placeholder="01XXXXXXXXX"
            />
          </div>
          
          <div>
            <Label htmlFor="ownership_start">{t.ownershipStart}</Label>
            <Input
              id="ownership_start"
              type="date"
              value={formData.ownership_start}
              onChange={(e) => setFormData({ ...formData, ownership_start: e.target.value })}
            />
          </div>
          
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" disabled={createOwner.isPending || updateOwner.isPending || !canSubmit}>
              {t.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
