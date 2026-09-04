import { ArrowDownLeft, BookOpen, BriefcaseBusiness, CarFront, CircleDollarSign, HeartPulse, House, Landmark, Laptop, Package, PartyPopper, ShieldCheck, ShoppingBag, ShoppingCart, TrendingUp, Utensils, Zap, type LucideIcon } from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  Mercado: ShoppingCart, Alimentação: Utensils, Transporte: CarFront, Moradia: House,
  Lazer: PartyPopper, Saúde: HeartPulse, Educação: BookOpen, 'Contas e serviços': Zap,
  Compras: ShoppingBag, Empréstimos: Landmark, Seguros: ShieldCheck, 'Outros gastos': Package,
  Salário: BriefcaseBusiness, 'Renda extra': Laptop, Rendimentos: TrendingUp,
  'Outras entradas': ArrowDownLeft, 'Empréstimo recebido': Landmark,
};

export function CategoryIcon({ label, size = 18 }: { label: string; size?: number }) {
  const Icon = icons[label] ?? CircleDollarSign;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}
