"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, Chip, Button } from '@/components/ui';

interface Dish {
  id: number;
  name: string;
  description: string;
  price: string;
  image_url?: string;
}

interface Category {
  id: number;
  name: string;
  dishes: Dish[];
}

interface MenuData {
  categories: Category[];
}

export default function ClientMenuPage() {
  const params = useParams();
  const qrToken = params.qrToken as string;

  const [menu, setMenu] = useState<MenuData | null>(null);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await api.get<MenuData>(`/menu/${qrToken}`);
        if (res.success && res.data) {
          setMenu(res.data);
          if (res.data.categories.length > 0) {
            setActiveCategory(res.data.categories[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
    loadCart();
  }, [qrToken]);

  const loadCart = () => {
    try {
      const stored = localStorage.getItem(`mesafacil_cart_${qrToken}`);
      if (stored) {
        setCartItems(JSON.parse(stored));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveCart = (items: any[]) => {
    localStorage.setItem(`mesafacil_cart_${qrToken}`, JSON.stringify(items));
    setCartItems(items);
    // Trigger custom event to sync layout cart badge
    window.dispatchEvent(new Event('cart-updated'));
  };

  const handleAddToCart = (dish: Dish) => {
    const existing = cartItems.find((item) => item.dish_id === dish.id);
    let newItems;

    if (existing) {
      newItems = cartItems.map((item) =>
        item.dish_id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newItems = [
        ...cartItems,
        {
          dish_id: dish.id,
          name: dish.name,
          price: parseFloat(dish.price),
          image_url: dish.image_url,
          quantity: 1,
          note: '',
        },
      ];
    }
    saveCart(newItems);
  };

  const handleRemoveFromCart = (dishId: number) => {
    const existing = cartItems.find((item) => item.dish_id === dishId);
    if (!existing) return;

    let newItems;
    if (existing.quantity === 1) {
      newItems = cartItems.filter((item) => item.dish_id !== dishId);
    } else {
      newItems = cartItems.map((item) =>
        item.dish_id === dishId ? { ...item, quantity: item.quantity - 1 } : item
      );
    }
    saveCart(newItems);
  };

  const getDishQuantityInCart = (dishId: number) => {
    const item = cartItems.find((i) => i.dish_id === dishId);
    return item ? item.quantity : 0;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary-container">
          progress_activity
        </span>
      </div>
    );
  }

  const selectedCategoryData = menu?.categories.find((c) => c.id === activeCategory);

  return (
    <div className="animate-fade-in flex flex-col gap-6 select-none">
      {/* Search menu */}
      <div className="relative flex items-center w-full">
        <span className="material-symbols-outlined absolute left-4 text-secondary pointer-events-none">
          search
        </span>
        <input
          type="text"
          placeholder="Buscar antojos..."
          className="w-full h-12 bg-surface-container-low text-on-surface font-body text-base rounded-2xl pl-12 pr-4 border-2 border-transparent outline-none focus:border-primary transition-all duration-200 shadow-sm"
        />
      </div>

      {/* Category Tabs list */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 select-none">
        {menu?.categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap active:scale-95 transition-all
                ${isActive
                  ? 'bg-primary-container text-on-primary shadow-orange'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                }
              `}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Dishes Listings */}
      <div className="flex flex-col gap-5 mt-2">
        {selectedCategoryData?.dishes.length === 0 ? (
          <div className="text-center py-12 text-secondary text-sm">
            No hay platillos disponibles en esta categoría.
          </div>
        ) : (
          selectedCategoryData?.dishes.map((dish) => {
            const qty = getDishQuantityInCart(dish.id);
            return (
              <Card key={dish.id} hoverable={true} className="p-0 border border-surface-container flex h-32 relative overflow-hidden select-none" onClick={() => handleAddToCart(dish)}>
                {/* Dish image or placeholder */}
                <div className="w-32 h-full bg-surface-container flex-shrink-0 relative">
                  {dish.image_url ? (
                    <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-2xl">flatware</span>
                    </div>
                  )}
                </div>

                {/* Details body */}
                <div className="p-4 flex flex-col flex-grow justify-between pr-5 select-none">
                  <div>
                    <h4 className="font-extrabold font-heading text-base text-on-surface line-clamp-1 leading-tight">{dish.name}</h4>
                    <p className="text-secondary text-[10px] font-medium leading-normal mt-1 line-clamp-2">
                      {dish.description || 'Delicioso platillo tradicional preparado al momento.'}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-1">
                    <span className="font-black text-primary text-base leading-none">${parseFloat(dish.price).toFixed(2)}</span>

                    {/* Quantity selectors or add button */}
                    <div onClick={(e) => e.stopPropagation()}>
                      {qty > 0 ? (
                        <div className="flex items-center bg-primary-fixed text-primary rounded-full p-0.5 shadow-sm border border-primary/10">
                          <button
                            onClick={() => handleRemoveFromCart(dish.id)}
                            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface-container-low active:scale-75 transition-all text-primary font-black"
                          >
                            <span className="material-symbols-outlined text-base">remove</span>
                          </button>
                          <span className="px-2 font-black text-sm text-center min-w-[20px]">{qty}</span>
                          <button
                            onClick={() => handleAddToCart(dish)}
                            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface-container-low active:scale-75 transition-all text-primary font-black"
                          >
                            <span className="material-symbols-outlined text-base">add</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(dish)}
                          className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-sm hover:brightness-105 active:scale-90 transition-all"
                        >
                          <span className="material-symbols-outlined text-lg">add</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
