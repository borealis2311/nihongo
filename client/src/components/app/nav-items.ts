import { BookText, Camera, House, LayoutGrid, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Trang chủ", short: "Trang chủ", icon: House },
  { href: "/topics", label: "Chủ đề", short: "Chủ đề", icon: LayoutGrid },
  { href: "/docs", label: "Tài liệu", short: "Tài liệu", icon: BookText },
  { href: "/import", label: "Nhập từ ảnh", short: "Nhập ảnh", icon: Camera },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
