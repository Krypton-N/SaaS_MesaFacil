"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { uploadDishImage } from '@/lib/supabase';
import { Card, Chip, Button, Input } from '@/components/ui';

interface Category {
  id: number;
  name: string;
  sort_order: number;
}

interface Dish {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: string;
  image_url?: string;
  active: boolean;
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newCatName, setNewCatName] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);

  const [dishName, setDishName] = useState('');
  const [dishDesc, setDishDesc] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishActive, setDishActive] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showAddDish, setShowAddDish] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // VLM AI Scanner states
  const [showAIScanner, setShowAIScanner] = useState(false);
  const [scanningImage, setScanningImage] = useState(false);
  const [extractedDishes, setExtractedDishes] = useState<any[]>([]);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCatId !== null) {
      fetchDishes(selectedCatId);
    }
  }, [selectedCatId]);

  const fetchCategories = async () => {
    try {
      const res = await api.get<Category[]>('/categories');
      if (res.success && res.data) {
        setCategories(res.data);
        if (res.data.length > 0 && selectedCatId === null) {
          setSelectedCatId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDishes = async (catId: number) => {
    try {
      const res = await api.get<Dish[]>(`/dishes?category_id=${catId}`);
      if (res.success && res.data) {
        setDishes(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await api.post<Category>('/categories', { name: newCatName, sort_order: categories.length + 1 });
      if (res.success && res.data) {
        setCategories([...categories, res.data]);
        setSelectedCatId(res.data.id);
        setNewCatName('');
        setShowAddCat(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim() || !dishPrice.trim() || selectedCatId === null) return;

    setUploadingImage(true);
    let imageUrl = '';

    try {
      if (selectedFile) {
        imageUrl = (await uploadDishImage(selectedFile)) || '';
      }

      const res = await api.post<Dish>('/dishes', {
        category_id: selectedCatId,
        name: dishName,
        description: dishDesc,
        price: parseFloat(dishPrice),
        active: dishActive,
        image_url: imageUrl || undefined
      });

      if (res.success && res.data) {
        setDishes([...dishes, res.data]);
        // Reset states
        setDishName('');
        setDishDesc('');
        setDishPrice('');
        setDishActive(true);
        setSelectedFile(null);
        setImagePreview(null);
        setShowAddDish(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleToggleActive = async (dish: Dish) => {
    try {
      const res = await api.patch<Dish>(`/dishes/${dish.id}`, { active: !dish.active });
      if (res.success && res.data) {
        setDishes(dishes.map(d => d.id === dish.id ? { ...d, active: res.data!.active } : d));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Lee un File como data URL (base64) para enviarlo al backend / VLM
  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleScanFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScanFile(file);
      setScanPreview(URL.createObjectURL(file));
      setScanError(null);
      setExtractedDishes([]);
    }
  };

  const closeAIScanner = () => {
    setShowAIScanner(false);
    setExtractedDishes([]);
    setScanFile(null);
    setScanPreview(null);
    setScanError(null);
  };

  const handleAIScan = async () => {
    if (!scanFile) {
      setScanError('Primero selecciona una foto del menú.');
      return;
    }
    setScanningImage(true);
    setScanError(null);
    try {
      const dataUrl = await fileToDataUrl(scanFile);
      const res = await api.post('/dishes/extract-from-image', { image: dataUrl });
      if (res.success && res.data) {
        const detected = res.data.extracted_dishes || [];
        setExtractedDishes(detected);
        if (detected.length === 0) {
          setScanError(res.data.message || 'La IA no detectó platillos en la imagen.');
        }
      } else {
        setScanError(res.error || 'No se pudo procesar la imagen con la IA.');
      }
    } catch (err) {
      console.error(err);
      setScanError('Error de conexión con el servidor.');
    } finally {
      setScanningImage(false);
    }
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

  return (
    <div className="animate-fade-in flex flex-col gap-8">
      {/* Header section */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight font-heading">
            Gestión del Menú
          </h1>
          <p className="text-secondary mt-1">Crea categorías, administra tus platillos y escanea nuevos menús con Inteligencia Artificial.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" icon="psychology" onClick={() => setShowAIScanner(true)}>
            Escanear Menú con IA
          </Button>
          <Button icon="add" onClick={() => setShowAddDish(true)}>
            Nuevo Platillo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories list sidebar */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold tracking-wider uppercase text-secondary">Categorías</h3>
            <button
              onClick={() => setShowAddCat(!showAddCat)}
              className="text-primary text-xs font-bold hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">{showAddCat ? 'close' : 'add'}</span>
              <span>{showAddCat ? 'Cancelar' : 'Nueva'}</span>
            </button>
          </div>

          {showAddCat && (
            <Card hoverable={false} className="p-4 border border-primary-container">
              <form onSubmit={handleAddCategory} className="flex flex-col gap-3">
                <Input
                  label="Nombre de Categoría"
                  placeholder="Ej: Bebidas, Postres"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
                <Button type="submit" size="sm" fullWidth>Guardar</Button>
              </form>
            </Card>
          )}

          <div className="flex flex-col gap-2">
            {categories.map((cat) => {
              const isSelected = selectedCatId === cat.id;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`
                    px-4 py-3.5 rounded-xl font-bold font-heading text-sm transition-all duration-200 cursor-pointer flex justify-between items-center select-none active:scale-[0.98]
                    ${isSelected
                      ? 'bg-primary-container text-on-primary shadow-orange'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                    }
                  `}
                >
                  <span>{cat.name}</span>
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dishes list main container */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-extrabold text-on-surface tracking-tight font-heading">
              {categories.find(c => c.id === selectedCatId)?.name || 'Platillos'}
            </h3>
            <span className="text-secondary text-sm font-medium">{dishes.length} platillos</span>
          </div>

          {/* Dishes grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {dishes.length === 0 ? (
              <Card hoverable={false} className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-secondary text-6xl mb-2">
                  flatware
                </span>
                <p className="text-on-surface font-extrabold font-heading text-lg">No hay platillos en esta categoría</p>
                <p className="text-secondary text-sm mt-1">Empieza agregando tu primer platillo con el botón de arriba.</p>
              </Card>
            ) : (
              dishes.map((dish) => (
                <Card key={dish.id} hoverable={false} className="p-0 border border-surface-container flex flex-col h-full relative overflow-hidden">
                  {/* Dish image or placeholder */}
                  <div className="w-full h-44 bg-surface-container relative">
                    {dish.image_url ? (
                      <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-4xl">image</span>
                        <span className="text-xs mt-1">Sin imagen</span>
                      </div>
                    )}
                    {/* Active pill indicator */}
                    <div className="absolute top-3 right-3">
                      <Chip variant={dish.active ? 'success' : 'default'}>
                        {dish.active ? 'Activo' : 'Pausado'}
                      </Chip>
                    </div>
                  </div>

                  {/* Body details */}
                  <div className="p-5 flex flex-col flex-1 gap-2">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-extrabold font-heading text-base text-on-surface line-clamp-1">{dish.name}</h4>
                      <span className="font-black text-primary text-base">${parseFloat(dish.price).toFixed(2)}</span>
                    </div>

                    <p className="text-secondary text-xs font-medium leading-relaxed flex-1 line-clamp-2">
                      {dish.description || 'Sin descripción disponible.'}
                    </p>

                    <div className="h-[1px] bg-surface-container my-2" />

                    {/* Actions */}
                    <div className="flex justify-between items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dish.active}
                          onChange={() => handleToggleActive(dish)}
                          className="w-4 h-4 rounded accent-primary border-surface-variant cursor-pointer"
                        />
                        <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Habilitar</span>
                      </label>

                      <div className="flex items-center gap-1">
                        <button className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container-low transition-colors">
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button className="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error-container/20 transition-colors">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Dish Modal Drawer */}
      {showAddDish && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-surface-container-lowest h-full shadow-lifted p-8 flex flex-col gap-6 overflow-y-auto animate-scale-in">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-extrabold tracking-tight font-heading">Agregar Nuevo Platillo</h3>
              <button
                onClick={() => setShowAddDish(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddDish} className="flex flex-col gap-5 flex-1">
              <Input
                label="Nombre del platillo"
                placeholder="Ej: Hamburguesa con queso"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="font-body text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant ml-1">
                  Descripción
                </label>
                <textarea
                  className="w-full min-h-[80px] bg-surface-container-low text-on-surface font-body text-base rounded-xl border-2 border-transparent outline-none focus:border-primary p-3 resize-none shadow-sm transition-all"
                  placeholder="Ingresa ingredientes, detalles o alérgenos..."
                  value={dishDesc}
                  onChange={(e) => setDishDesc(e.target.value)}
                />
              </div>

              <Input
                label="Precio (MXN)"
                type="number"
                step="0.01"
                placeholder="149.00"
                value={dishPrice}
                onChange={(e) => setDishPrice(e.target.value)}
                required
              />

              {/* Image upload */}
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant ml-1">
                  Imagen del Platillo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-surface-variant bg-surface-container-low flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-secondary text-2xl">add_photo_alternate</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="dish-image-input"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="dish-image-input"
                      className="px-4 py-2 border border-surface-variant text-on-surface rounded-xl text-xs font-bold hover:bg-surface-container-low cursor-pointer active:scale-95 transition-all select-none"
                    >
                      Seleccionar Archivo
                    </label>
                    <span className="text-secondary text-[10px] font-medium">Recomendado: 800x600 PNG o JPG</span>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={dishActive}
                  onChange={(e) => setDishActive(e.target.checked)}
                  className="w-5 h-5 rounded accent-primary border-surface-variant cursor-pointer"
                />
                <span className="text-sm font-bold text-on-surface">Disponible inmediatamente</span>
              </label>

              <Button
                type="submit"
                loading={uploadingImage}
                fullWidth
                className="mt-auto shadow-orange font-bold text-base py-4"
              >
                Crear Platillo
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* VLM AI Menu Scanner Dialog */}
      {showAIScanner && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-2xl bg-surface-container-lowest shadow-lifted rounded-2xl p-8 flex flex-col gap-6 animate-scale-in max-h-[85vh]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl font-bold">psychology</span>
                <h3 className="text-xl font-extrabold tracking-tight font-heading">Escáner de Menús con VLM Inteligente</h3>
              </div>
              <button
                onClick={closeAIScanner}
                className="w-10 h-10 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-secondary text-sm leading-relaxed">
              Sube una foto de tu menú impreso y la Inteligencia Artificial (hospedada localmente en LM Studio) se encargará de extraer automáticamente todos los nombres, descripciones y precios sugeridos.
            </p>

            {scanError && (
              <div className="p-3 bg-error-container text-on-error-container text-sm font-semibold rounded-xl flex items-center gap-2 border border-error/20">
                <span className="material-symbols-outlined text-lg">error</span>
                <span>{scanError}</span>
              </div>
            )}

            {extractedDishes.length === 0 ? (
              <label
                htmlFor="vlm-menu-upload"
                className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-surface-variant rounded-2xl bg-surface-container-low/50 cursor-pointer hover:border-primary transition-colors"
              >
                {scanPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={scanPreview} alt="Vista previa del menú" className="max-h-48 rounded-xl object-contain mb-3" />
                ) : (
                  <span className="material-symbols-outlined text-secondary text-5xl mb-2">upload_file</span>
                )}
                <p className="text-on-surface font-bold">
                  {scanFile ? scanFile.name : 'Haz clic para subir la imagen del menú'}
                </p>
                <p className="text-secondary text-xs mt-1">Formatos permitidos: JPG, PNG</p>
                <input
                  id="vlm-menu-upload"
                  type="file"
                  accept="image/png, image/jpeg"
                  className="hidden"
                  onChange={handleScanFileChange}
                />
                <Button
                  className="mt-5"
                  onClick={(e) => { e.preventDefault(); handleAIScan(); }}
                  loading={scanningImage}
                  disabled={!scanFile}
                  icon="bolt"
                >
                  {scanningImage ? 'Analizando con IA…' : 'Escanear menú con IA'}
                </Button>
              </label>
            ) : (
              <div className="flex flex-col gap-4 overflow-y-auto pr-2 no-scrollbar max-h-[400px]">
                <h4 className="font-extrabold font-heading text-sm text-secondary uppercase tracking-wider">Platillos Detectados ({extractedDishes.length})</h4>
                <div className="flex flex-col gap-3">
                  {extractedDishes.map((dish, i) => (
                    <Card key={i} hoverable={false} className="p-4 border border-surface-container flex justify-between items-center">
                      <div>
                        <h5 className="font-extrabold font-heading text-sm text-on-surface">{dish.name}</h5>
                        <p className="text-secondary text-xs mt-0.5">{dish.description}</p>
                        <Chip variant="primary" className="mt-2 text-[9px]">{dish.suggested_category}</Chip>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-primary text-sm">${dish.price || '0.00'}</span>
                        <Button size="sm" icon="add" onClick={() => {
                          setDishName(dish.name);
                          setDishDesc(dish.description);
                          setDishPrice(String(dish.price || ''));
                          setShowAddDish(true);
                          closeAIScanner();
                        }}>Agregar</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
