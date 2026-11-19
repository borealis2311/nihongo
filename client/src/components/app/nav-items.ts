import { BookOpen, Bookmark, House, Layers, LayoutGrid, UserRound, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
  badge?: "due";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Trang chủ", short: "Trang chủ", icon: House },
  { href: "/topics", label: "Chủ đề", short: "Chủ đề", icon: LayoutGrid },
  { href: "/review", label: "Ôn từ", short: "Ôn từ", icon: Layers, badge: "due" },
  { href: "/dictionary", label: "Từ điển", short: "Từ điển", icon: BookOpen },
  { href: "/notebook", label: "Sổ từ của tôi", short: "Sổ từ", icon: Bookmark },
  { href: "/profile", label: "Hồ sơ", short: "Hồ sơ", icon: UserRound },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
