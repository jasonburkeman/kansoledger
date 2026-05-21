import React, { useCallback, useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { Transaction } from "../types";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { cn } from "../lib/utils";

interface FileUploadProps {
  onDataParsed: (transactions: Transaction[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataParsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "parsing" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback((file: File) => {
    setStatus("parsing");
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (json.length === 0) {
          throw new Error("No data found in the spreadsheet");
        }

        // Improved column mapping logic
        const parsedTransactions: Transaction[] = json.map((row, index) => {
          const keys = Object.keys(row);
          
          // Try to find columns by name common variations
          const dateKey = keys.find(k => k.toLowerCase().includes("date"));
          const descKey = keys.find(k => k.toLowerCase().includes("desc") || k.toLowerCase().includes("payee") || k.toLowerCase().includes("merchant"));
          const amountKey = keys.find(k => k.toLowerCase().includes("amount") || k.toLowerCase().includes("value") || k.toLowerCase().includes("price"));
          const categoryKey = keys.find(k => k.toLowerCase().includes("category") || k.toLowerCase().includes("type") || k.toLowerCase().includes("tags"));

          const amount = parseFloat(String(row[amountKey || keys[2]] || 0).replace(/[$,]/g, ""));
          
          return {
            id: `trans-${index}-${Date.now()}`,
            date: row[dateKey || keys[0]] ? new Date(row[dateKey || keys[0]]) : new Date(),
            description: row[descKey || keys[1]] || "Unknown Transaction",
            amount: Math.abs(amount),
            category: row[categoryKey || keys[3]] || "Uncategorized",
            type: amount >= 0 ? "income" : "expense"
          };
        });

        onDataParsed(parsedTransactions);
        setStatus("success");
      } catch (err: any) {
        console.error(err);
        setStatus("error");
        setError(err.message || "Failed to parse file. Please check the format.");
      }
    };

    reader.onerror = () => {
      setStatus("error");
      setError("File reading failed");
    };

    reader.readAsBinaryString(file);
  }, [onDataParsed]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  return (
    <Card className={cn("border-2 border-dashed transition-all rounded-3xl", isDragging ? "border-natural-sage bg-natural-sage/5" : "border-slate-200")}>
      <CardContent className="p-0">
        <label
          className="flex flex-col items-center justify-center w-full h-80 cursor-pointer"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-8">
            {status === "idle" && (
              <>
                <div className="p-5 bg-natural-sage/10 rounded-2xl mb-6 transform rotate-3">
                  <Upload className="w-10 h-10 text-natural-sage" />
                </div>
                <p className="mb-2 text-xl font-serif font-bold tracking-tight text-natural-accent">Harvest your data</p>
                <p className="text-sm text-slate-500 mb-6 max-w-xs leading-relaxed">
                  Drop your Excel or CSV file here. We'll automatically sprout your budget from the numbers.
                </p>
                <Button variant="outline" size="sm" className="rounded-xl px-8 border-slate-200">Select File</Button>
              </>
            )}

            {status === "parsing" && (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-natural-sage border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-lg font-serif font-medium text-natural-accent">Analyzing your harvest...</p>
              </div>
            )}

            {status === "success" && (
              <>
                <div className="p-5 bg-emerald-50 rounded-2xl mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <p className="mb-2 text-xl font-serif font-bold text-emerald-700">Abundant Success!</p>
                <p className="text-sm text-slate-500 mb-6">Your dashboard is now flourishing.</p>
                <Button variant="outline" size="sm" className="rounded-xl border-slate-200" onClick={(e) => { e.preventDefault(); setStatus("idle"); }}>Upload Another</Button>
              </>
            )}

            {status === "error" && (
              <>
                <div className="p-5 bg-rose-50 rounded-2xl mb-6">
                  <AlertCircle className="w-10 h-10 text-rose-600" />
                </div>
                <p className="mb-2 text-xl font-serif font-bold text-rose-700">Stormy Skies</p>
                <p className="text-sm text-slate-500 mb-6">{error}</p>
                <Button variant="outline" size="sm" className="rounded-xl border-slate-200" onClick={(e) => { e.preventDefault(); setStatus("idle"); }}>Try Again</Button>
              </>
            )}
          </div>
          <input type="file" className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileInput} />
        </label>
      </CardContent>
    </Card>
  );
};
