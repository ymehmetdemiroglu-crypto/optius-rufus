import { useState, useEffect } from 'react';
import { Palette, Upload } from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface BrandingPanelProps {
  brandData?: {
    companyName: string;
    website?: string | null;
    primaryColor: string;
    logoBase64?: string | null;
  } | null;
  onSave: (data: { companyName: string; website: string; primaryColor: string; logoBase64: string }) => void;
}

export default function BrandingPanel({ brandData, onSave }: BrandingPanelProps) {
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#b8860b");
  const [logoBase64, setLogoBase64] = useState("");

  useEffect(() => {
    if (brandData) {
      setTimeout(() => {
        setCompanyName(brandData.companyName);
        setWebsite(brandData.website || "");
        setPrimaryColor(brandData.primaryColor);
        setLogoBase64(brandData.logoBase64 || "");
      }, 0);
    }
  }, [brandData]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoBase64(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ companyName, website, primaryColor, logoBase64 });
  };

  return (
    <div className="col-span-12 max-w-2xl mx-auto w-full">
      <form onSubmit={handleSave}>
        <Card className="bg-white space-y-6">
          <h2 className="font-display font-black text-xl uppercase tracking-wider border-b-[2px] border-brand-dark pb-3 flex items-center gap-2">
            <Palette size={20} /> White-Label Settings
          </h2>
          
          <p className="font-mono text-xs text-gray-500">
            Configure your agency branding details. These settings dynamically theme the diagnostic landing pages (`/p/:slug`) in print mode and apply your custom styling directly onto Puppeteer PDF exports.
          </p>

          <div className="space-y-2">
            <label className="font-mono text-xs uppercase font-bold block">Agency / Company Name</label>
            <Input 
              type="text" 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Marketing Group"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-mono text-xs uppercase font-bold block">Agency Website</label>
              <Input 
                type="url" 
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://acmemarketing.com"
              />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-xs uppercase font-bold block">Primary Brand Color (Hex)</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-12 w-16 border-[3px] border-brand-dark cursor-pointer bg-white"
                />
                <Input 
                  type="text" 
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="font-mono"
                  placeholder="#b8860b"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-xs uppercase font-bold block">Agency Logo Image File</label>
            <div className="border-[3px] border-dashed border-brand-dark p-6 flex flex-col items-center justify-center bg-[#fafafa]">
              {logoBase64 ? (
                <div className="text-center space-y-4">
                  <img src={logoBase64} alt="Agency Logo Preview" className="max-h-16 mx-auto object-contain border border-gray-200 p-1" />
                  <button 
                    type="button" 
                    onClick={() => setLogoBase64("")}
                    className="text-xs font-mono font-bold text-red-600 underline cursor-pointer"
                  >
                    Remove Logo
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <Upload size={24} className="mx-auto text-gray-400" />
                  <p className="font-mono text-xs font-bold">Drag & Drop or click to upload logo</p>
                  <p className="font-mono text-[10px] text-gray-400">PNG or JPG. Encoded as Base64 in SQLite</p>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden" 
                    id="logo-file-input" 
                  />
                  <label htmlFor="logo-file-input" className="inline-block mt-2 bg-brand-dark text-white font-mono text-[10px] px-3 py-1.5 uppercase font-bold cursor-pointer hover:bg-brand-dark/80">
                    Choose Image File
                  </label>
                </div>
              )}
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full mt-4">
            Save Branding Settings
          </Button>
        </Card>
      </form>
    </div>
  );
}
