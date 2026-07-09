"use client";

import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LogoUploadProps {
  companyId: string;
  storageId?: string | null;
  onUpdate?: () => void;
}

export function LogoThumb({ companyId, storageId }: { companyId: string; storageId: string }) {
  const logoUrl = useQuery(
    api.queries.companies.getStorageUrl,
    { storageId }
  );
  if (!logoUrl) return null;
  return (
    <img
      src={logoUrl}
      alt="Logo"
      className="h-14 w-auto rounded border object-contain bg-white"
    />
  );
}

export function LogoUpload({ companyId, storageId, onUpdate }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const generateUploadUrl = useMutation(api.mutations.storage.generateUploadUrl);
  const saveLogo = useMutation(api.mutations.storage.saveLogo);
  const deleteLogo = useMutation(api.mutations.storage.deleteLogo);

  const logoUrl = useQuery(
    api.queries.companies.getStorageUrl,
    storageId ? { storageId } : "skip"
  );

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Format accepté : PNG, JPEG, WebP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image trop volumineuse (max 2 Mo)");
      return;
    }
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        body: file,
      });
      if (!result.ok) {
        const text = await result.text().catch(() => "");
        throw new Error(`Upload failed (${result.status}): ${text}`);
      }
      const { storageId: newId } = await result.json();
      await saveLogo({ companyId: companyId as any, storageId: newId });
      toast.success("Logo enregistré");
      onUpdate?.();
    } catch (err: any) {
      console.error("Logo upload error:", err);
      toast.error(err.message ?? "Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    try {
      await deleteLogo({ companyId: companyId as any });
      toast.success("Logo supprimé");
      onUpdate?.();
    } catch {
      toast.error("Erreur");
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Logo</label>
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <div className="relative group">
            <img
              src={logoUrl}
              alt="Logo"
              className="h-14 w-auto rounded border object-contain bg-white"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="h-14 w-28 rounded border border-dashed border-zinc-300 flex items-center justify-center text-xs text-zinc-400">
            Aucun logo
          </div>
        )}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFile}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <Upload className="h-3.5 w-3.5 mr-1" />
            )}
            {storageId ? "Changer" : "Ajouter"}
          </Button>
        </div>
      </div>
    </div>
  );
}
