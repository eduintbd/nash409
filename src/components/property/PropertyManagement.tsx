import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFlats, useCreateFlat, useDeleteFlat, Flat } from '@/hooks/useFlats';
import { usePropertyDocuments, useUploadPropertyDocument, useDeletePropertyDocument, getPropertyDocumentUrl } from '@/hooks/usePropertyDocuments';
import { useUtilityBills, useUploadUtilityBill, useDeleteUtilityBill, getUtilityBillUrl } from '@/hooks/useUtilityBills';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { 
  Building2, Plus, Trash2, Upload, FileText, X, Download,
  Zap, Droplets, Flame, Wifi, Receipt, Eye
} from 'lucide-react';

interface PropertyManagementProps {
  onEditFlat?: (flat: Flat) => void;
}

export const PropertyManagement = ({ onEditFlat }: PropertyManagementProps) => {
  const { language } = useLanguage();
  const { data: flats } = useFlats();
  const createFlat = useCreateFlat();
  const deleteFlat = useDeleteFlat();
  const uploadPropertyDoc = useUploadPropertyDocument();
  const deletePropertyDoc = useDeletePropertyDocument();
  const uploadUtilityBill = useUploadUtilityBill();
  const deleteUtilityBill = useDeleteUtilityBill();

  // Get unique building names
  const buildings = [...new Set(flats?.map(f => f.building_name).filter(Boolean) || [])];
  
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [activeTab, setActiveTab] = useState('flats');
  
  // New property form state
  const [showNewProperty, setShowNewProperty] = useState(false);
  const [newPropertyForm, setNewPropertyForm] = useState({
    propertyName: '',
    numberOfFlats: '',
    flatNumberPrefix: '',
    startFloor: '2',
  });

  // New flat form state (for adding to existing property)
  const [showAddFlat, setShowAddFlat] = useState(false);
  const [newFlatForm, setNewFlatForm] = useState({
    flatNumber: '',
    floor: '',
    size: '1200',
    parkingSpot: '',
  });

  // Document upload state
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('general');
  const docFileRef = useRef<HTMLInputElement>(null);

  // Utility bill upload state
  const [selectedFlatId, setSelectedFlatId] = useState('');
  const [billType, setBillType] = useState('electricity');
  const [billMonth, setBillMonth] = useState('');
  const [billYear, setBillYear] = useState(new Date().getFullYear().toString());
  const [billAmount, setBillAmount] = useState('');
  const [billPaidBy, setBillPaidBy] = useState('tenant');
  const billFileRef = useRef<HTMLInputElement>(null);

  const { data: propertyDocs } = usePropertyDocuments(selectedBuilding);
  const { data: utilityBills } = useUtilityBills();

  // Filter flats by selected building
  const buildingFlats = flats?.filter(f => f.building_name === selectedBuilding) || [];
  const buildingUtilityBills = utilityBills?.filter(b => 
    buildingFlats.some(f => f.id === b.flat_id)
  ) || [];

  const statusColors = {
    'owner-occupied': 'bg-primary/10 text-primary border-primary/20',
    'tenant': 'bg-success/10 text-success border-success/20',
    'vacant': 'bg-muted text-muted-foreground border-border',
  };

  const statusLabels = {
    'owner-occupied': language === 'bn' ? 'মালিক' : 'Owner',
    'tenant': language === 'bn' ? 'ভাড়াটিয়া' : 'Tenant',
    'vacant': language === 'bn' ? 'খালি' : 'Vacant',
  };

  const billTypeIcons = {
    electricity: Zap,
    water: Droplets,
    gas: Flame,
    internet: Wifi,
    other: Receipt,
  };

  // Create new property with flats
  const handleCreateProperty = async () => {
    if (!newPropertyForm.propertyName || !newPropertyForm.numberOfFlats || !newPropertyForm.flatNumberPrefix) {
      toast.error(language === 'bn' ? 'সব তথ্য পূরণ করুন' : 'Please fill all required fields');
      return;
    }

    const numFlats = parseInt(newPropertyForm.numberOfFlats) || 1;
    const prefix = newPropertyForm.flatNumberPrefix.trim();
    const startFloor = parseInt(newPropertyForm.startFloor) || 2;
    const flatsPerFloor = 4;

    try {
      for (let i = 0; i < numFlats; i++) {
        const floor = startFloor + Math.floor(i / flatsPerFloor);
        const flatIndex = i % flatsPerFloor;
        const flatLetter = String.fromCharCode(65 + flatIndex);
        const flatNumber = `${prefix}-${floor}${flatLetter}`;

        await createFlat.mutateAsync({
          building_name: newPropertyForm.propertyName,
          flat_number: flatNumber,
          floor: floor,
          size: 1200,
          status: 'vacant',
          parking_spot: null,
        });
      }

      toast.success(language === 'bn' ? `${numFlats}টি ফ্ল্যাট সহ প্রপার্টি তৈরি হয়েছে` : `Property created with ${numFlats} flats`);
      setShowNewProperty(false);
      setNewPropertyForm({ propertyName: '', numberOfFlats: '', flatNumberPrefix: '', startFloor: '2' });
      setSelectedBuilding(newPropertyForm.propertyName);
    } catch (error) {
      toast.error(language === 'bn' ? 'প্রপার্টি তৈরিতে সমস্যা' : 'Failed to create property');
    }
  };

  // Add flat to existing property
  const handleAddFlat = async () => {
    if (!selectedBuilding || !newFlatForm.flatNumber || !newFlatForm.floor) {
      toast.error(language === 'bn' ? 'সব তথ্য পূরণ করুন' : 'Please fill all required fields');
      return;
    }

    try {
      await createFlat.mutateAsync({
        building_name: selectedBuilding,
        flat_number: newFlatForm.flatNumber,
        floor: parseInt(newFlatForm.floor),
        size: parseInt(newFlatForm.size) || 1200,
        status: 'vacant',
        parking_spot: newFlatForm.parkingSpot || null,
      });

      toast.success(language === 'bn' ? 'ফ্ল্যাট যোগ হয়েছে' : 'Flat added successfully');
      setShowAddFlat(false);
      setNewFlatForm({ flatNumber: '', floor: '', size: '1200', parkingSpot: '' });
    } catch (error) {
      toast.error(language === 'bn' ? 'ফ্ল্যাট যোগে সমস্যা' : 'Failed to add flat');
    }
  };

  // Handle document upload
  const handleDocUpload = async () => {
    const file = docFileRef.current?.files?.[0];
    if (!file || !selectedBuilding || !docName) {
      toast.error(language === 'bn' ? 'ফাইল এবং নাম দিন' : 'Please select file and enter name');
      return;
    }

    try {
      await uploadPropertyDoc.mutateAsync({
        file,
        buildingName: selectedBuilding,
        documentName: docName,
        documentType: docType,
      });
      setDocName('');
      setDocType('general');
      if (docFileRef.current) docFileRef.current.value = '';
    } catch (error) {
      // Error handled in hook
    }
  };

  // Handle utility bill upload
  const handleBillUpload = async () => {
    const file = billFileRef.current?.files?.[0];
    if (!file || !selectedFlatId || !billMonth || !billYear) {
      toast.error(language === 'bn' ? 'সব তথ্য পূরণ করুন' : 'Please fill all required fields');
      return;
    }

    try {
      await uploadUtilityBill.mutateAsync({
        file,
        flatId: selectedFlatId,
        billType,
        billMonth,
        billYear: parseInt(billYear),
        amount: parseFloat(billAmount) || 0,
        paidBy: billPaidBy,
      });
      setBillMonth('');
      setBillAmount('');
      if (billFileRef.current) billFileRef.current.value = '';
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleViewDocument = async (filePath: string) => {
    const url = await getPropertyDocumentUrl(filePath);
    if (url) window.open(url, '_blank');
  };

  const handleViewBill = async (filePath: string) => {
    const url = await getUtilityBillUrl(filePath);
    if (url) window.open(url, '_blank');
  };

  const months = [
    { value: 'january', label: language === 'bn' ? 'জানুয়ারি' : 'January' },
    { value: 'february', label: language === 'bn' ? 'ফেব্রুয়ারি' : 'February' },
    { value: 'march', label: language === 'bn' ? 'মার্চ' : 'March' },
    { value: 'april', label: language === 'bn' ? 'এপ্রিল' : 'April' },
    { value: 'may', label: language === 'bn' ? 'মে' : 'May' },
    { value: 'june', label: language === 'bn' ? 'জুন' : 'June' },
    { value: 'july', label: language === 'bn' ? 'জুলাই' : 'July' },
    { value: 'august', label: language === 'bn' ? 'আগস্ট' : 'August' },
    { value: 'september', label: language === 'bn' ? 'সেপ্টেম্বর' : 'September' },
    { value: 'october', label: language === 'bn' ? 'অক্টোবর' : 'October' },
    { value: 'november', label: language === 'bn' ? 'নভেম্বর' : 'November' },
    { value: 'december', label: language === 'bn' ? 'ডিসেম্বর' : 'December' },
  ];

  return (
    <div className="space-y-6">
      {/* Property Selection or Creation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {language === 'bn' ? 'প্রপার্টি নির্বাচন করুন' : 'Select Property'}
            </span>
            <Button onClick={() => setShowNewProperty(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {language === 'bn' ? 'নতুন প্রপার্টি' : 'New Property'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showNewProperty ? (
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
              <h4 className="font-medium">{language === 'bn' ? 'নতুন প্রপার্টি তৈরি করুন' : 'Create New Property'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'bn' ? 'প্রপার্টির নাম' : 'Property Name'} *</Label>
                  <Input
                    value={newPropertyForm.propertyName}
                    onChange={(e) => setNewPropertyForm({ ...newPropertyForm, propertyName: e.target.value })}
                    placeholder={language === 'bn' ? 'যেমন: গ্রিন ভিউ টাওয়ার' : 'e.g., Green View Tower'}
                  />
                </div>
                <div>
                  <Label>{language === 'bn' ? 'ফ্ল্যাট সংখ্যা' : 'Number of Flats'} *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newPropertyForm.numberOfFlats}
                    onChange={(e) => setNewPropertyForm({ ...newPropertyForm, numberOfFlats: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'bn' ? 'ফ্ল্যাট প্রিফিক্স' : 'Flat Prefix'} *</Label>
                  <Input
                    value={newPropertyForm.flatNumberPrefix}
                    onChange={(e) => setNewPropertyForm({ ...newPropertyForm, flatNumberPrefix: e.target.value.toUpperCase() })}
                    placeholder="e.g., NB, FL"
                  />
                </div>
                <div>
                  <Label>{language === 'bn' ? 'শুরু তলা' : 'Starting Floor'}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newPropertyForm.startFloor}
                    onChange={(e) => setNewPropertyForm({ ...newPropertyForm, startFloor: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateProperty} disabled={createFlat.isPending}>
                  {createFlat.isPending ? (language === 'bn' ? 'তৈরি হচ্ছে...' : 'Creating...') : (language === 'bn' ? 'তৈরি করুন' : 'Create')}
                </Button>
                <Button variant="outline" onClick={() => setShowNewProperty(false)}>
                  <X className="h-4 w-4 mr-1" />
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
              </div>
            </div>
          ) : (
            <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'bn' ? 'একটি প্রপার্টি নির্বাচন করুন...' : 'Select a property...'} />
              </SelectTrigger>
              <SelectContent>
                {buildings.map((building) => (
                  <SelectItem key={building} value={building!}>
                    {building}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Property Details - Only show when a building is selected */}
      {selectedBuilding && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>{selectedBuilding}</span>
              <Badge variant="secondary">
                {buildingFlats.length} {language === 'bn' ? 'টি ফ্ল্যাট' : 'Flats'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="flats">
                  {language === 'bn' ? 'ফ্ল্যাটসমূহ' : 'Flats'}
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <FileText className="h-4 w-4 mr-1" />
                  {language === 'bn' ? 'ডকুমেন্ট' : 'Documents'}
                </TabsTrigger>
                <TabsTrigger value="bills">
                  <Receipt className="h-4 w-4 mr-1" />
                  {language === 'bn' ? 'বিল' : 'Bills'}
                </TabsTrigger>
              </TabsList>

              {/* Flats Tab */}
              <TabsContent value="flats" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setShowAddFlat(!showAddFlat)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {language === 'bn' ? 'ফ্ল্যাট যোগ করুন' : 'Add Flat'}
                  </Button>
                </div>

                {showAddFlat && (
                  <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                    <h4 className="font-medium">{language === 'bn' ? 'নতুন ফ্ল্যাট যোগ করুন' : 'Add New Flat'}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label>{language === 'bn' ? 'ফ্ল্যাট নম্বর' : 'Flat No.'} *</Label>
                        <Input
                          value={newFlatForm.flatNumber}
                          onChange={(e) => setNewFlatForm({ ...newFlatForm, flatNumber: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>{language === 'bn' ? 'তলা' : 'Floor'} *</Label>
                        <Input
                          type="number"
                          value={newFlatForm.floor}
                          onChange={(e) => setNewFlatForm({ ...newFlatForm, floor: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>{language === 'bn' ? 'সাইজ (sqft)' : 'Size (sqft)'}</Label>
                        <Input
                          type="number"
                          value={newFlatForm.size}
                          onChange={(e) => setNewFlatForm({ ...newFlatForm, size: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>{language === 'bn' ? 'পার্কিং' : 'Parking'}</Label>
                        <Input
                          value={newFlatForm.parkingSpot}
                          onChange={(e) => setNewFlatForm({ ...newFlatForm, parkingSpot: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddFlat} size="sm" disabled={createFlat.isPending}>
                        {language === 'bn' ? 'যোগ করুন' : 'Add'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowAddFlat(false)}>
                        {language === 'bn' ? 'বাতিল' : 'Cancel'}
                      </Button>
                    </div>
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'bn' ? 'ফ্ল্যাট নম্বর' : 'Flat No.'}</TableHead>
                      <TableHead>{language === 'bn' ? 'তলা' : 'Floor'}</TableHead>
                      <TableHead>{language === 'bn' ? 'সাইজ' : 'Size'}</TableHead>
                      <TableHead>{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</TableHead>
                      <TableHead>{language === 'bn' ? 'পার্কিং' : 'Parking'}</TableHead>
                      <TableHead className="text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buildingFlats.map((flat) => (
                      <TableRow key={flat.id}>
                        <TableCell className="font-medium">{flat.flat_number}</TableCell>
                        <TableCell>{flat.floor}</TableCell>
                        <TableCell>{flat.size.toLocaleString()} sqft</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[flat.status]}>
                            {statusLabels[flat.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>{flat.parking_spot || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {onEditFlat && (
                              <Button variant="ghost" size="sm" onClick={() => onEditFlat(flat)}>
                                {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                              </Button>
                            )}
                            {flat.status === 'vacant' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteFlat.mutate(flat.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-4">
                <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {language === 'bn' ? 'ডকুমেন্ট আপলোড' : 'Upload Document'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>{language === 'bn' ? 'ডকুমেন্ট নাম' : 'Document Name'}</Label>
                      <Input
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        placeholder={language === 'bn' ? 'যেমন: NOC' : 'e.g., NOC'}
                      />
                    </div>
                    <div>
                      <Label>{language === 'bn' ? 'ধরন' : 'Type'}</Label>
                      <Select value={docType} onValueChange={setDocType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">{language === 'bn' ? 'সাধারণ' : 'General'}</SelectItem>
                          <SelectItem value="legal">{language === 'bn' ? 'আইনি' : 'Legal'}</SelectItem>
                          <SelectItem value="tax">{language === 'bn' ? 'ট্যাক্স' : 'Tax'}</SelectItem>
                          <SelectItem value="agreement">{language === 'bn' ? 'চুক্তি' : 'Agreement'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{language === 'bn' ? 'ফাইল' : 'File'}</Label>
                      <Input type="file" ref={docFileRef} accept=".pdf,.doc,.docx,.jpg,.png" />
                    </div>
                  </div>
                  <Button onClick={handleDocUpload} disabled={uploadPropertyDoc.isPending} size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadPropertyDoc.isPending ? (language === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...') : (language === 'bn' ? 'আপলোড' : 'Upload')}
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'bn' ? 'নাম' : 'Name'}</TableHead>
                      <TableHead>{language === 'bn' ? 'ধরন' : 'Type'}</TableHead>
                      <TableHead>{language === 'bn' ? 'তারিখ' : 'Date'}</TableHead>
                      <TableHead className="text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {propertyDocs?.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.document_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.document_type}</Badge>
                        </TableCell>
                        <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleViewDocument(doc.file_path)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deletePropertyDoc.mutate({ id: doc.id, filePath: doc.file_path })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!propertyDocs || propertyDocs.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          {language === 'bn' ? 'কোনো ডকুমেন্ট নেই' : 'No documents yet'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              {/* Utility Bills Tab */}
              <TabsContent value="bills" className="space-y-4">
                <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    {language === 'bn' ? 'ইউটিলিটি বিল আপলোড' : 'Upload Utility Bill'}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label>{language === 'bn' ? 'ফ্ল্যাট' : 'Flat'}</Label>
                      <Select value={selectedFlatId} onValueChange={setSelectedFlatId}>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'bn' ? 'ফ্ল্যাট নির্বাচন' : 'Select flat'} />
                        </SelectTrigger>
                        <SelectContent>
                          {buildingFlats.map((flat) => (
                            <SelectItem key={flat.id} value={flat.id}>
                              {flat.flat_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{language === 'bn' ? 'বিলের ধরন' : 'Bill Type'}</Label>
                      <Select value={billType} onValueChange={setBillType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="electricity">{language === 'bn' ? 'বিদ্যুৎ' : 'Electricity'}</SelectItem>
                          <SelectItem value="water">{language === 'bn' ? 'পানি' : 'Water'}</SelectItem>
                          <SelectItem value="gas">{language === 'bn' ? 'গ্যাস' : 'Gas'}</SelectItem>
                          <SelectItem value="internet">{language === 'bn' ? 'ইন্টারনেট' : 'Internet'}</SelectItem>
                          <SelectItem value="other">{language === 'bn' ? 'অন্যান্য' : 'Other'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{language === 'bn' ? 'মাস' : 'Month'}</Label>
                      <Select value={billMonth} onValueChange={setBillMonth}>
                        <SelectTrigger>
                          <SelectValue placeholder={language === 'bn' ? 'মাস' : 'Month'} />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{language === 'bn' ? 'বছর' : 'Year'}</Label>
                      <Input
                        type="number"
                        value={billYear}
                        onChange={(e) => setBillYear(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>{language === 'bn' ? 'পরিমাণ' : 'Amount'}</Label>
                      <Input
                        type="number"
                        value={billAmount}
                        onChange={(e) => setBillAmount(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>{language === 'bn' ? 'পরিশোধকারী' : 'Paid By'}</Label>
                      <Select value={billPaidBy} onValueChange={setBillPaidBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tenant">{language === 'bn' ? 'ভাড়াটিয়া' : 'Tenant'}</SelectItem>
                          <SelectItem value="owner">{language === 'bn' ? 'মালিক' : 'Owner'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>{language === 'bn' ? 'বিল ফাইল' : 'Bill File'}</Label>
                      <Input type="file" ref={billFileRef} accept=".pdf,.jpg,.png" />
                    </div>
                  </div>
                  <Button onClick={handleBillUpload} disabled={uploadUtilityBill.isPending} size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadUtilityBill.isPending ? (language === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...') : (language === 'bn' ? 'আপলোড' : 'Upload')}
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'bn' ? 'ফ্ল্যাট' : 'Flat'}</TableHead>
                      <TableHead>{language === 'bn' ? 'ধরন' : 'Type'}</TableHead>
                      <TableHead>{language === 'bn' ? 'মাস/বছর' : 'Month/Year'}</TableHead>
                      <TableHead>{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
                      <TableHead>{language === 'bn' ? 'পরিশোধকারী' : 'Paid By'}</TableHead>
                      <TableHead className="text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buildingUtilityBills.map((bill) => {
                      const BillIcon = billTypeIcons[bill.bill_type as keyof typeof billTypeIcons] || Receipt;
                      return (
                        <TableRow key={bill.id}>
                          <TableCell className="font-medium">{bill.flats?.flat_number}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              <BillIcon className="h-4 w-4" />
                              {bill.bill_type}
                            </span>
                          </TableCell>
                          <TableCell>{bill.bill_month} {bill.bill_year}</TableCell>
                          <TableCell>৳{bill.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {bill.paid_by === 'tenant' ? (language === 'bn' ? 'ভাড়াটিয়া' : 'Tenant') : (language === 'bn' ? 'মালিক' : 'Owner')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleViewBill(bill.file_path)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteUtilityBill.mutate({ id: bill.id, filePath: bill.file_path })}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {buildingUtilityBills.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          {language === 'bn' ? 'কোনো বিল নেই' : 'No bills yet'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
