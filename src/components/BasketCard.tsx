'use client';

import { useCart } from '@/lib/cart/CartContext';
import { useRouter } from 'next/navigation';

interface BasketCardProps {
  basket: {
    id: string;
    name: string;
    description: string;
    price: number;
    weight: number;
    persons: number;
  };
  colorClass: string;
  isPopular?: boolean;
}

export function BasketCard({ basket, colorClass, isPopular }: BasketCardProps) {
  const { addItem } = useCart();
  const router = useRouter();

  const handleAddToCart = () => {
    addItem({
      type: 'basket',
      productId: basket.id,
      name: basket.name,
      description: `${basket.weight}kg de fruits frais de saison`,
      price: basket.price,
    });
    router.push('/commander');
  };

  return (
    <div
      className={`relative p-6 rounded-2xl bg-background border-2 border-${colorClass} transition-all hover:scale-[1.02] hover:shadow-lg`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-fruit-orange text-background text-sm font-semibold rounded-full">
          Populaire
        </div>
      )}

      <div className={`w-16 h-16 bg-${colorClass}/10 rounded-2xl flex items-center justify-center mb-4`}>
        <span className="text-3xl">🧺</span>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{basket.name}</h3>
      <p className="text-foreground-muted text-sm mb-4">{basket.description}</p>

      <div className="flex items-baseline gap-2 mb-4">
        <span className={`text-4xl font-bold text-${colorClass}`}>{basket.price}€</span>
        <span className="text-foreground-muted">/ livraison</span>
      </div>

      <ul className="space-y-2 mb-6">
        <li className="flex items-center gap-2 text-foreground-muted">
          <span className={`text-${colorClass}`}>✓</span>
          {basket.weight}kg de fruits frais
        </li>
        <li className="flex items-center gap-2 text-foreground-muted">
          <span className={`text-${colorClass}`}>✓</span>
          Pour {basket.persons} personnes
        </li>
        <li className="flex items-center gap-2 text-foreground-muted">
          <span className={`text-${colorClass}`}>✓</span>
          Fruits de saison variés
        </li>
        <li className="flex items-center gap-2 text-foreground-muted">
          <span className={`text-${colorClass}`}>✓</span>
          Livraison incluse
        </li>
      </ul>

      <button
        onClick={handleAddToCart}
        className={`w-full py-3 rounded-xl font-semibold transition-all ${
          isPopular
            ? `bg-${colorClass} text-background hover:opacity-90`
            : `border border-${colorClass} text-${colorClass} hover:bg-${colorClass} hover:text-background`
        }`}
      >
        Commander ce panier
      </button>
    </div>
  );
}
