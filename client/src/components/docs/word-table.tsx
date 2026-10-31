"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { Word } from "@/lib/strapi";

const PAGE_SIZE = 10;

export function WordTable({ words }: { words: Word[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(words.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageWords = words.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const goTo = (p: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    setPage(Math.min(Math.max(p, 1), totalPages));
  };

  return (
    <div className="mb-11">
      <div className="overflow-hidden rounded-xl border border-border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-auto bg-secondary px-4 py-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Từ
              </TableHead>
              <TableHead className="h-auto bg-secondary px-4 py-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Hiragana
              </TableHead>
              <TableHead className="h-auto bg-secondary px-4 py-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Katakana
              </TableHead>
              <TableHead className="h-auto bg-secondary px-4 py-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Romaji
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageWords.map((w) => (
              <TableRow key={w.id} className="hover:bg-transparent">
                <TableCell className="px-4 py-3 text-base font-semibold whitespace-normal">
                  {w.word}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm whitespace-normal text-muted-foreground">
                  {w.hiragana || "—"}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm whitespace-normal text-muted-foreground">
                  {w.katakana || "—"}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm whitespace-normal text-muted-foreground italic">
                  {w.romaji || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={goTo(currentPage - 1)}
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink href="#" isActive={p === currentPage} onClick={goTo(p)}>
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={goTo(currentPage + 1)}
                aria-disabled={currentPage === totalPages}
                className={
                  currentPage === totalPages ? "pointer-events-none opacity-50" : undefined
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
