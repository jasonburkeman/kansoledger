import React from "react";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "./ui/table";
import { Transaction } from "../types";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";

interface TransactionTableProps {
  transactions: Transaction[];
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
  return (
    <div className="rounded-2xl border-slate-100 border bg-white overflow-hidden">
      <ScrollArea className="h-[500px]">
        <Table>
          <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
            <TableRow className="border-slate-100">
              <TableHead className="w-[120px] text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Description</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</TableHead>
              <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-400 italic">
                  Waiting for your data...
                </TableCell>
              </TableRow>
            ) : (
              transactions
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .map((t) => (
                  <TableRow key={t.id} className="hover:bg-natural-bg/50 border-slate-50 transition-colors">
                    <TableCell className="text-xs text-slate-400 font-medium">
                      {format(t.date, "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium text-natural-accent">
                      {t.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-natural-sage/10 text-natural-sage border-none font-medium text-[10px] uppercase tracking-wider">
                        {t.category}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-serif font-bold ${t.type === "expense" ? "text-natural-ink" : "text-emerald-600"}`}>
                      {t.type === "expense" ? "-" : "+"}
                      ${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};
